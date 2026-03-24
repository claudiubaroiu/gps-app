import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Inițializare hartă
const map = L.map("map").setView([46.57, 26.91], 13);
let selectedPosition = null;
map.on("click", function (e) {
  selectedPosition = [e.latlng.lat, e.latlng.lng];

  // marker temporar (vizual)
  if (window.tempMarker) {
    map.removeLayer(window.tempMarker);
  }

  window.tempMarker = L.marker(selectedPosition).addTo(map);
});
const accidentIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/565/565547.png",
  iconSize: [30, 30],
});

const radarIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149995.png",
  iconSize: [30, 30],
});

const trafficIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [30, 30],
});

// OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

let currentPosition = null;

// GPS
navigator.geolocation.getCurrentPosition((pos) => {
  currentPosition = [pos.coords.latitude, pos.coords.longitude];
  map.setView(currentPosition, 15);
});

// Adaugă report
window.addReport = async function () {
  if (!selectedPosition) return alert("Selectează un punct pe hartă!");

  const type = document.getElementById("type").value;

  await addDoc(collection(db, "reports"), {
    type,
    lat: selectedPosition[0],
    lng: selectedPosition[1],
    votes: 0,
    timestamp: Date.now(),
  });

  alert("Adăugat!");
  loadReports();
};

// Încarcă markers
async function loadReports() {
  const querySnapshot = await getDocs(collection(db, "reports"));

  querySnapshot.forEach((doc) => {
    const data = doc.data();

    L.marker([data.lat, data.lng], {
      icon: getIcon(data.type),
    })
      .addTo(map)
      .bindPopup(`${data.type} | Votes: ${data.votes}`);
  });
}
function getIcon(type) {
  switch (type) {
    case "accident":
      return accidentIcon;
    case "radar":
      return radarIcon;
    case "traffic":
      return trafficIcon;
    default:
      return accidentIcon;
  }
}
loadReports();
