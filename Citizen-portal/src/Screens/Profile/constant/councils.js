export const SRI_LANKA_PROVINCES = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province",
].sort();

export const SRI_LANKA_COUNCILS_BY_PROVINCE = {
  "Western Province": [
    "Colombo Municipal Council",
    "Dehiwala–Mount Lavinia Municipal Council",
    "Gampaha Municipal Council",
    "Kalutara Municipal Council",
    "Kaduwela Municipal Council",
    "Moratuwa Municipal Council",
    "Negombo Municipal Council",
    "Sri Jayawardenepura Kotte Municipal Council",
    "Kolonnawa Urban Council",
    "Seethawakapura Urban Council",
    "Maharagama Urban Council",
    "Boralesgamuwa Urban Council",
    "Kesbewa Urban Council",
    "Wattala‑Mabola Urban Council",
    "Katunayake‑Seeduwa Urban Council",
    "Minuwangoda Urban Council",
    "Ja‑Ela Urban Council",
    "Peliyagoda Urban Council",
    // Add Pradeshiya Sabha if you want to include rural ones too (e.g. Homagama Pradeshiya Sabha)
  ],
  "Central Province": [
    "Kandy Municipal Council",
    "Matale Municipal Council",
    "Nuwara Eliya Municipal Council",
    "Wattegama Urban Council",
    "Kadugannawa Urban Council",
    "Gampola Urban Council",
    "Nawalapitiya Urban Council",
    "Hatton‑Dickoya Urban Council",
    "Thalawakele‑Lindula Urban Council",
    // Common additions: Dambulla Municipal Council (often listed under Matale)
  ],
  "Southern Province": [
    "Galle Municipal Council",
    "Matara Municipal Council",
    "Hambantota Municipal Council",
    "Panadura Urban Council",
    "Horana Urban Council",
    "Beruwala Urban Council",
    "Ambalangoda Urban Council",
    "Hikkaduwa Urban Council",
    "Weligama Urban Council",
    "Tangalle Urban Council",
  ],
  "Uva Province": [
    "Badulla Municipal Council",
    "Bandarawela Municipal Council",
    "Haputale Urban Council",
  ],
  "Eastern Province": [
    "Batticaloa Municipal Council",
    "Kalmunai Municipal Council",
    "Ampara Urban Council",
    "Eravur Urban Council",
    "Kattankudy Urban Council",
    "Kinniya Urban Council",
    "Trincomalee Urban Council",
  ],
  "Northern Province": [
    "Jaffna Municipal Council",
    "Vavuniya Municipal Council",
    "Akkaraipattu Municipal Council",
    "Valvettithurai Urban Council",
    "Point Pedro Urban Council",
    "Chavakachcheri Urban Council",
    "Mannar Urban Council",
    "Vavuniya Urban Council",
  ],
  "North Western Province": [
    "Kurunegala Municipal Council",
    "Puttalam Municipal Council",
    "Kuliyapitiya Urban Council",
    "Puttalam Urban Council",
    "Chilaw Urban Council",
  ],
  "North Central Province": [
    "Anuradhapura Municipal Council",
    "Polonnaruwa Municipal Council",
    // Mostly Pradeshiya Sabha; add if needed e.g. "Medawachchiya Pradeshiya Sabha"
  ],
  "Sabaragamuwa Province": [
    "Ratnapura Municipal Council",
    "Kegalle Municipal Council",
    "Balangoda Urban Council",
    "Embilipitiya Urban Council",
  ],
};

export const getCouncilsForProvince = (province) => {
  if (!province) return [];
  return SRI_LANKA_COUNCILS_BY_PROVINCE[province] || [];
};