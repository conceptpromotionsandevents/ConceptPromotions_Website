const Status = ({ campaign }) => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold text-[#E4002B] border-b-2 border-[#E4002B] pb-2">
      Status Update
    </h3>
    <p><strong>Status:</strong> {campaign.status}</p>
  </div>
);

export default Status;
