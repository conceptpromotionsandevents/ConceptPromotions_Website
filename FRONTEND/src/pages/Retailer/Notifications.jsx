import React from "react";
import { FaBell } from "react-icons/fa";

const notifications = [
  {
    id: 1,
    title: "Campaign Assigned",
    message: "A new campaign has been assigned to you. Please check details.",
    time: "2 hours ago",
  },
  {
    id: 2,
    title: "Payment Credited",
    message: "₹1,200 has been added to your passbook.",
    time: "1 day ago",
  },
  {
    id: 3,
    title: "Profile Updated",
    message: "Your profile has been successfully updated.",
    time: "2 days ago",
  },
];

const Notifications = () => {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-[#E4002B] mb-4 flex items-center gap-2">
        <FaBell className="text-[#E4002B]" />
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <p className="text-gray-600">No new notifications.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>

              <p className="text-sm text-gray-600">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
