const getStatusClasses = (status) => {
  switch (status) {
    case 'Resolved':
      return 'bg-green-100 text-green-800';
    case 'In Progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'Verified':
      return 'bg-blue-100 text-blue-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Pending':
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const StatusBadge = ({ status }) => {
  return (
    <span 
      className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClasses(status)}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;