const Info = ({ campaign }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Campaign Info</h3>

      <p className="mb-2"><strong>Start:</strong> {campaign.startDate}</p>
      <p className="mb-2"><strong>End:</strong> {campaign.endDate}</p>
      <p className="mb-4"><strong>Description:</strong> {campaign.description}</p>

      <h4 className="text-lg font-semibold mt-4 mb-2">Terms & Conditions</h4>
      <ul className="list-disc ml-6 text-gray-700">
        {campaign.terms?.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
};

export default Info;
