import React, { useState, useEffect } from 'react';
import { Map, Marker } from 'pigeon-maps';
import { Camera, MapPin, Send, X, CheckCircle, ImagePlus, FileText, Calendar, Truck } from 'lucide-react';
import ReportStyles from './styles/styles';
import { submitGarbageReport } from './Service/supabaseReportService';
import { submitPickupRequest } from './Service/supabasePickupService';
import { supabase } from '../../lib/supabaseClient';

const GarbageReport = () => {
  const [mode, setMode] = useState('report');
  const [lastAction, setLastAction] = useState(null);
  const [center, setCenter] = useState([51.505, -0.09]);
  const [marker, setMarker] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userId, setUserId] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [desc, setDesc] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [isSubmittingPickup, setIsSubmittingPickup] = useState(false);
  const [hasCouncil, setHasCouncil] = useState(null);
  const [councilCheckLoading, setCouncilCheckLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchCouncil = async () => {
      try {
        setCouncilCheckLoading(true);
        const { data, error } = await supabase
          .from('citizen')
          .select('nearestcouncil')
          .eq('citizenid', userId)
          .maybeSingle();

        if (error) throw error;

        const council = data?.nearestcouncil?.trim();
        setHasCouncil(!!council && council.length > 0);
      } catch (err) {
        console.error('Failed to check council:', err);
        setHasCouncil(false);
      } finally {
        setCouncilCheckLoading(false);
      }
    };

    fetchCouncil();
  }, [userId]);

  const findMe = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([latitude, longitude]);
        setMarker([latitude, longitude]);
        setIsLocating(false);
      },
      () => {
        alert('Could not get location. Please pick on map.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    findMe();
  }, []);

  useEffect(() => {
    return () => photos.forEach(p => URL.revokeObjectURL(p.url));
  }, [photos]);

  const handleFiles = (fileList) => {
    const newPhotos = Array.from(fileList).map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2, 11),
    }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 4));
  };

  const removePhoto = id => setPhotos(prev => prev.filter(p => p.id !== id));

  const onDragOver = e => e.preventDefault();
  const onDrop = e => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const submitReport = async e => {
    e.preventDefault();
    if (!userId) return alert('Please log in');
    if (!marker) return alert('Please select location');
    if (!photos.length) return alert('At least one photo required');

    setIsSubmittingReport(true);
    try {
      const result = await submitGarbageReport({
        latitude: marker[0],
        longitude: marker[1],
        description: desc,
        photos: photos.map(p => p.file),
        citizenno: userId,
      });

      if (!result.success) throw result.error;
      setLastAction('report');
      setMode('success');
    } catch (err) {
      alert('Report failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const submitPickup = async e => {
    e.preventDefault();

    if (!userId) return alert('Please log in first');
    if (!marker) return alert('Please select location on map');
    if (!pickupDate) return alert('Please select a pickup date');

    if (councilCheckLoading) {
      return alert('Checking your profile... please wait a moment.');
    }

    if (hasCouncil === false) {
      return alert(
        'Please add your nearest council in your profile first.\n\n' +
        'Go to Profile → Edit Profile → Set Nearest Council'
      );
    }

    setIsSubmittingPickup(true);
    try {
      const result = await submitPickupRequest({
        latitude: marker[0],
        longitude: marker[1],
        requestedDate: pickupDate,
        citizenno: userId,
      });

      if (!result.success) throw result.error;
      setLastAction('pickup');
      setMode('success');
    } catch (err) {
      alert('Pickup request failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmittingPickup(false);
    }
  };

  if (mode === 'success') {
    return (
      <div className="app-viewport">
        <ReportStyles />
        <div className="main-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <CheckCircle size={80} color="#10b981" />
          <h2 style={{ margin: '24px 0 16px' }}>
            {lastAction === 'pickup' ? 'Pickup Request Sent!' : 'Report Submitted!'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '16px', lineHeight: 1.5 }}>
            {lastAction === 'pickup'
              ? 'We will review your request and schedule the pickup.'
              : 'Thank you! Our team will review the reported location soon.'}
          </p>
          <button
            className="send-report-btn"
            style={{ marginTop: '32px', width: '100%' }}
            onClick={() => {
              setMode('report');
              setLastAction(null);
              setPhotos([]);
              setDesc('');
              setPickupDate('');
              setPickupNotes('');
              findMe();
            }}
          >
            New Action
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <ReportStyles />

      <div className="fixed-mode-bar">
        <div className="mode-selector-inner">
          <button
            className={`top-action-btn ${mode === 'report' ? 'active' : ''}`}
            onClick={() => setMode('report')}
          >
            <FileText size={20} /> Report Illegal Dumping
          </button>
          <button
            className={`top-action-btn ${mode === 'pickup' ? 'active' : ''}`}
            onClick={() => setMode('pickup')}
          >
            <Truck size={20} /> Schedule Pickup
          </button>
        </div>
      </div>

      <div className="main-card">
        <div className="top-banner">
          <h1>
            {mode === 'report' ? <FileText size={28} /> : <Truck size={28} />}
            {mode === 'report' ? ' Report Illegal Waste' : ' Schedule Pickup'}
          </h1>
          <p>
            {mode === 'report'
              ? 'Help us keep the environment clean'
              : 'Request collection of your accumulated waste'}
          </p>
        </div>

        <div style={{ padding: '24px 24px 0' }}>
          <label className="input-heading">
            <MapPin size={16} /> Location
          </label>
          <div className="map-container-box">
            <Map
              height={300}
              center={center}
              zoom={16}
              onClick={({ latLng }) => setMarker(latLng)}
            >
              {marker && <Marker width={50} anchor={marker} color="#059669" />}
            </Map>
            <button
              className="locate-me-btn"
              onClick={findMe}
              disabled={isLocating}
            >
              {isLocating ? 'Locating...' : 'My Location'}
            </button>
          </div>
        </div>

        {mode === 'report' && (
          <form className="form-pad" onSubmit={submitReport}>
            <div>
              <label className="input-heading">
                <Camera size={16} /> Photos (1–4)
              </label>
              <div
                className="drop-zone"
                onDragOver={onDragOver}
                onDrop={onDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <ImagePlus size={48} color="#10b981" />
                <div className="camera-action-text">Tap or drag photos here</div>
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={e => handleFiles(e.target.files)}
                />
              </div>

              {photos.length > 0 && (
                <div className="photo-grid">
                  {photos.map(p => (
                    <div key={p.id} className="photo-item">
                      <img src={p.url} alt="preview" />
                      <button
                        type="button"
                        className="remove-photo-btn"
                        onClick={() => removePhoto(p.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="input-heading">Description *</label>
              <textarea
                className="description-box"
                rows={4}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Describe the waste type, quantity, hazards..."
                required
              />
            </div>

            <button
              type="submit"
              className="send-report-btn"
              disabled={isSubmittingReport || !userId || !marker || !photos.length}
            >
              {isSubmittingReport ? 'Submitting...' : <><Send size={18} /> Submit Report</>}
            </button>
          </form>
        )}

        {mode === 'pickup' && (
          <form className="form-pad" onSubmit={submitPickup}>
            <div style={{
              background: hasCouncil === false ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${hasCouncil === false ? '#fecaca' : '#a7f3d0'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '14px',
              color: hasCouncil === false ? '#991b1b' : '#065f46',
            }}>
              {councilCheckLoading ? (
                'Checking your council setting...'
              ) : hasCouncil ? (
                'Your nearest council is set ✓'
              ) : (
                <>
                  <strong>Action required:</strong> Please set your nearest council in your profile 
                  before scheduling a pickup.
                </>
              )}
            </div>

            <div>
              <label className="input-heading">
                <Calendar size={16} /> Preferred Pickup Date
              </label>
              <input
                type="date"
                className="date-input"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <label className="input-heading">Additional Notes (optional)</label>
              <textarea
                className="description-box"
                rows={3}
                value={pickupNotes}
                onChange={e => setPickupNotes(e.target.value)}
                placeholder="Gate code, best time, special instructions..."
              />
            </div>

            <button
              type="submit"
              className="send-pickup-btn"
              disabled={
                isSubmittingPickup ||
                !userId ||
                !marker ||
                !pickupDate ||
                councilCheckLoading ||
                hasCouncil === false
              }
            >
              {isSubmittingPickup ? 'Submitting...' : <><Truck size={18} /> Request Pickup</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GarbageReport;