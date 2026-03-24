import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const map = L.map("map").setView([46.57, 26.91], 13);
let selectedPosition = null;
map.on("click", function (e) {
  selectedPosition = [e.latlng.lat, e.latlng.lng];

  if (window.tempMarker) {
    map.removeLayer(window.tempMarker);
  }

  window.tempMarker = L.marker(selectedPosition).addTo(map);
});
const accidentIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/1476/1476799.png",
  iconSize: [30, 30],
});

const radarIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/5600/5600529.png",
  iconSize: [30, 30],
});

const trafficIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/2569/2569846.png",
  iconSize: [30, 30],
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap",
}).addTo(map);

let currentPosition = null;

navigator.geolocation.getCurrentPosition((pos) => {
  currentPosition = [pos.coords.latitude, pos.coords.longitude];
  map.setView(currentPosition, 15);
  L.circle(currentPosition, {
    radius: 2000,
    color: "blue",
    fillOpacity: 0.1,
  }).addTo(map);
  listenReports();
});
navigator.geolocation.watchPosition((pos) => {
  currentPosition = [pos.coords.latitude, pos.coords.longitude];

  map.setView(currentPosition, 15);

  if (radiusCircle) {
    map.removeLayer(radiusCircle);
  }

  radiusCircle = L.circle(currentPosition, {
    radius: 2000,
    color: "blue",
    fillOpacity: 0.1,
  }).addTo(map);

  listenReports();
});

window.addReport = async function () {
  if (!selectedPosition) {
    return alert("Selectează un punct pe hartă!");
  }

  if (!currentPosition) {
    return alert("Nu avem locația ta!");
  }

  const distance = getDistance(
    currentPosition[0],
    currentPosition[1],
    selectedPosition[0],
    selectedPosition[1],
  );

  if (distance > 2) {
    return alert(
      "Poți adăuga evenimente doar pe o rază de 2 km de la locația ta!",
    );
  }

  const type = document.getElementById("type").value;

  await addDoc(collection(db, "reports"), {
    type,
    lat: selectedPosition[0],
    lng: selectedPosition[1],
    votes: 0,
    timestamp: Date.now(),
  });

  alert("Eveniment adăugat!");
  listenReports();
};

function listenReports() {
  onSnapshot(collection(db, "reports"), async (snapshot) => {
    await cleanupOldReports(snapshot);

    if (window.markers) {
      window.markers.forEach((m) => map.removeLayer(m));
    }
    window.markers = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const now = Date.now();
      const age = now - data.timestamp;

      if (age > 3600000) {
        return;
      }

      const distance = getDistance(
        currentPosition[0],
        currentPosition[1],
        data.lat,
        data.lng,
      );

      if (distance <= 2) {
        const marker = L.marker([data.lat, data.lng], {
          icon: getIcon(data.type),
        })
          .addTo(map)
          .bindPopup(
            `${data.type} <br> ${distance.toFixed(2)} km <br> ${getTimeAgo(data.timestamp)} în urmă`,
          );

        window.markers.push(marker);
      }
    });
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
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return "acum";
  if (diff < 3600) return Math.floor(diff / 60) + " min";

  return Math.floor(diff / 3600) + " h";
}
async function cleanupOldReports(snapshot) {
  const now = Date.now();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    if (!data.timestamp) continue;

    const age = now - data.timestamp;
    console.log(age);
    if (age > 3600000) {
      try {
        await deleteDoc(doc(db, "reports", docSnap.id));
        console.log("Șters:", docSnap.id);
      } catch (e) {
        console.error("Eroare ștergere:", e);
      }
    }
  }
}
