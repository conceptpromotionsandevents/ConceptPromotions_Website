const Period = ({ campaign }) => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold text-[#E4002B] border-b-2 border-[#E4002B] pb-2">
      Campaign Duration 
    </h3>
    <p>
      Campaign runs from <strong>{campaign.startDate}</strong> to <strong>{campaign.endDate}</strong>.
    </p>
  </div>
);

export default Period;
