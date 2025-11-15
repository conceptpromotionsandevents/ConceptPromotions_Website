const Period = ({ campaign }) => (
  <p>
    Campaign runs from <strong>{campaign.startDate}</strong> to <strong>{campaign.endDate}</strong>.
  </p>
);

export default Period;
