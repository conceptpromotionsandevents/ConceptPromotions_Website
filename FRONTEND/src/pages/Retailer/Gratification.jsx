import React from "react";

const Gratification = ({ campaign }) => {
  console.log("Gratification component - campaign data:", campaign);
  console.log("Gratification images:", campaign?.gratification?.images);

  if (!campaign) {
    return <div className="text-center text-gray-500">No campaign data available</div>;
  }

  const gratification = campaign.gratification || {};
  const gratificationType = gratification.type || "";
  const gratificationDescription = gratification.description || "";
  const gratificationImages = gratification.images || [];

  console.log("Extracted gratification images:", gratificationImages);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-[#E4002B] border-b-2 border-[#E4002B] pb-2">
        Gratification Details
      </h3>

      {/* Gratification Type */}
      {gratificationType && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Gratification Type</h4>
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-medium">
              {gratificationType}
            </span>
          </div>
        </div>
      )}

      {/* Gratification Description */}
      {gratificationDescription && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Description</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {gratificationDescription}
          </p>
        </div>
      )}

      {/* Gratification Images - Simple Display */}
      {gratificationImages && gratificationImages.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Gratification Images</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gratificationImages.map((image, index) => {
              const imageUrl = image?.url || image;
              console.log(`Gratification image ${index}:`, imageUrl);
              
              return (
                <div key={image?.publicId || index} className="rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                  <img
                    src={imageUrl}
                    alt={`Gratification ${index + 1}`}
                    className="w-full h-auto object-contain bg-gray-50"
                    onError={(e) => {
                      console.error(`Failed to load gratification image ${index}:`, imageUrl);
                      e.target.src = 'https://via.placeholder.com/600x300?text=Image+Not+Available';
                    }}
                    onLoad={() => console.log(`Gratification image ${index} loaded successfully`)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!gratificationType && !gratificationDescription && (!gratificationImages || gratificationImages.length === 0) && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">No gratification details available for this campaign.</p>
        </div>
      )}
    </div>
  );
};

export default Gratification;
