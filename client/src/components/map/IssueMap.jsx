import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix for default Leaflet icons not appearing correctly in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Helper component to fit map to markers
const FitBounds = ({ positions }) => {
  const map = useMap();
  if (positions.length > 0) {
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [50, 50] }); // Add some padding around markers
  }
  return null;
};

const IssueMap = ({ issues }) => {
  // Extract marker positions
  const positions = issues.map(issue => {
    const [lon, lat] = issue.location.coordinates;
    return [lat, lon];
  });

  // Fallback position if no issues
  const defaultPosition = [12.9716, 77.5946]; // Bangalore

  return (
    <div className="rounded-lg overflow-hidden shadow-xl mb-6">
      <MapContainer
        center={positions[0] || defaultPosition} // Initial center
        zoom={12}
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {issues.map((issue) => {
          const [lon, lat] = issue.location.coordinates;
          return (
            <Marker key={issue._id} position={[lat, lon]}>
              <Popup>
                <div className="font-bold">{issue.title}</div>
                <p className="text-sm">Status: {issue.status}</p>
                <Link
                  to={`/issues/${issue._id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-xs mt-1 block"
                >
                  View Details
                </Link>
              </Popup>
            </Marker>
          );
        })}

        {/* Auto-fit all markers */}
        <FitBounds positions={positions} />
      </MapContainer>
    </div>
  );
};

export default IssueMap;
