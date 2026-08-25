import { supabase } from "../lib/supabaseClient";
import * as tf from "@tensorflow/tfjs";

let congestionModel = null;

export async function createOrLoadModel() {
  if (congestionModel) return congestionModel;

  try {
    congestionModel = await tf.loadLayersModel(
      "localstorage://congestion-model",
    );
    console.log("Loaded persisted congestion model.");

    congestionModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });
  } catch (e) {
    console.log("No persisted model found, creating new one.");

    congestionModel = tf.sequential();
    congestionModel.add(
      tf.layers.dense({ units: 64, activation: "relu", inputShape: [5] }),
    );
    congestionModel.add(tf.layers.dropout({ rate: 0.2 }));
    congestionModel.add(tf.layers.dense({ units: 32, activation: "relu" }));
    congestionModel.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    congestionModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    await trainModel(congestionModel);
    await congestionModel.save("localstorage://congestion-model");
  }

  return congestionModel;
}

function extractFeaturesFromLeg(leg) {
  const durationTraffic = leg.duration_in_traffic?.value || leg.duration.value;

  const durationNormal = leg.duration.value;
  const distanceKm = leg.distance.value / 1000;
  const avgSpeed = (leg.distance.value / durationTraffic) * 3.6;

  const now = new Date();

  return {
    features: [
      now.getHours() / 23,
      now.getDay() / 6,
      Math.min(distanceKm / 50, 1),
      Math.min(avgSpeed / 120, 1),
      Math.min(durationTraffic / durationNormal, 2),
    ],
    congested: durationTraffic > durationNormal * 1.3 ? 1 : 0,
  };
}

export async function onlineLearnFromTrip(leg) {
  const model = await createOrLoadModel();

  if (!model || !model.optimizer) {
    console.warn("Model not ready for online learning");
    return;
  }

  const features = extractFeaturesFromLeg(leg);
  const label = estimateCongestionLabel(leg);

  const xs = tf.tensor2d([features]);
  const ys = tf.tensor2d([[label]]);

  await model.fit(xs, ys, {
    epochs: 1,
    batchSize: 1,
  });

  xs.dispose();
  ys.dispose();

  await model.save("localstorage://congestion-model");
}

export async function predictCongestionProbability(routeLeg) {
  const model = await createOrLoadModel();
  const { features } = extractFeaturesFromLeg(routeLeg);

  const input = tf.tensor2d([features]);
  const pred = model.predict(input);
  const prob = (await pred.data())[0];

  input.dispose();
  pred.dispose();

  return prob;
}

export async function getAIRouteDecision(
  primaryResult,
  currentPosition,
  destination,
  waypoints = [],
) {
  const primaryRoute = primaryResult.routes[0];
  const primaryLeg = primaryRoute.legs[0];

  const primaryProb = await predictCongestionProbability(primaryLeg);

  if (primaryProb < 0.6) {
    return {
      route: primaryRoute,
      isBypass: false,
      reason: "Low predicted congestion",
    };
  }

  const service = new window.google.maps.DirectionsService();

  return new Promise((resolve) => {
    service.route(
      {
        origin: currentPosition,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: true,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
        },
      },
      async (result, status) => {
        if (status !== "OK") {
          resolve({
            route: primaryRoute,
            isBypass: false,
            reason: "Bypass request failed",
          });
          return;
        }

        const bypassRoute = result.routes[0];
        const bypassLeg = bypassRoute.legs[0];

        const bypassProb = await predictCongestionProbability(bypassLeg);

        if (bypassProb < primaryProb) {
          resolve({
            route: bypassRoute,
            isBypass: true,
            reason: "AI-selected bypass (lower congestion)",
          });
        } else {
          resolve({
            route: primaryRoute,
            isBypass: false,
            reason: "Primary route still better",
          });
        }
      },
    );
  });
}
