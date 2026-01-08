import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../url/base";

const OutletsAssigned = ({ campaign }) => {
  const [assignedRetailers, setAssignedRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!campaign?._id) {
      setLoading(false);
      return;
    }

    const fetchAssignedRetailers = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        // ✅ Try multiple localStorage keys to find employee info
        let employeeInfo = null;
        const possibleKeys = ["user", "employee", "employeeInfo", "employee_user", "userData"];
        
        console.log("=== CHECKING LOCALSTORAGE ===");
        console.log("All localStorage keys:", Object.keys(localStorage));

        for (const key of possibleKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              console.log(`Found data in localStorage key "${key}":`, parsed);
              
              // Check if it has employee-like properties
              if (parsed._id || parsed.id || parsed.userId || parsed.role === "employee") {
                employeeInfo = parsed;
                console.log(`✅ Using employee info from key: "${key}"`, employeeInfo);
                break;
              }
            } catch (e) {
              console.log(`Key "${key}" is not valid JSON`);
            }
          }
        }

        // ✅ If still not found, try to decode JWT token
        if (!employeeInfo) {
          console.log("⚠️ Employee info not found in localStorage, trying to decode token...");
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            console.log("Decoded token payload:", tokenPayload);
            employeeInfo = {
              _id: tokenPayload.id || tokenPayload._id || tokenPayload.userId,
              email: tokenPayload.email,
              role: tokenPayload.role
            };
            console.log("✅ Extracted employee info from token:", employeeInfo);
          } catch (e) {
            console.error("Failed to decode token:", e);
          }
        }

        if (!employeeInfo || (!employeeInfo._id && !employeeInfo.id && !employeeInfo.userId)) {
          setError("Employee information not found. Please login again.");
          setLoading(false);
          return;
        }

        // Get employee ID
        const employeeId = employeeInfo._id || employeeInfo.id || employeeInfo.userId;
        console.log("Using employee ID:", employeeId);

        // Fetch mapping
        const response = await axios.get(
          `${API_URL}/admin/campaign/${campaign._id}/employee-retailer-mapping`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("=== MAPPING RESPONSE ===");
        console.log("Response data:", response.data);

        if (!response.data.employees || response.data.employees.length === 0) {
          console.log("No employees found in response");
          setAssignedRetailers([]);
          setLoading(false);
          return;
        }

        console.log("Employees in response:", response.data.employees.map(e => ({
          id: e._id || e.id,
          name: e.name
        })));

        // Find current employee
        const currentEmployee = response.data.employees.find(
          (emp) => {
            const empId = emp._id || emp.id;
            const match = empId && empId.toString() === employeeId.toString();
            console.log(`Comparing ${empId} with ${employeeId}: ${match}`);
            return match;
          }
        );

        console.log("Current employee found:", currentEmployee);

        if (currentEmployee && currentEmployee.retailers && currentEmployee.retailers.length > 0) {
          console.log(`✅ Found ${currentEmployee.retailers.length} retailers`);
          setAssignedRetailers(currentEmployee.retailers);
        } else {
          console.log("❌ No retailers found for current employee");
          setAssignedRetailers([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching assigned retailers:", err);
        console.error("Error details:", err.response?.data);
        setError(err.response?.data?.message || "Failed to load assigned outlets");
        setLoading(false);
      }
    };

    fetchAssignedRetailers();
  }, [campaign]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse text-gray-600">Loading assigned outlets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-[#E4002B] border-b-2 border-[#E4002B] pb-2">
        Assigned Outlets
      </h3>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Total Outlets Assigned:</span>
          <span className="text-2xl font-bold text-[#E4002B]">{assignedRetailers.length}</span>
        </div>
      </div>

      {/* Outlets List */}
      {assignedRetailers.length > 0 ? (
        <div className="space-y-4">
          {assignedRetailers.map((retailer, index) => (
            <div 
              key={retailer._id || retailer.id || index} 
              className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-[#E4002B] hover:shadow-md transition-shadow"
            >
              {/* Outlet Header - ✅ Removed Active badge */}
              <div className="mb-3">
                <h4 className="text-lg font-semibold text-gray-800">
                  {retailer.shopDetails?.shopName || retailer.name || "Unnamed Outlet"}
                </h4>
                <p className="text-sm text-gray-500">
                  ID: {retailer.uniqueId || retailer.retailerCode || "N/A"}
                </p>
              </div>

              {/* Outlet Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {/* Name - ✅ Changed from "Contact" to "Name" */}
                {retailer.name && (
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-600 min-w-[100px]">Retailer Name:</span>
                    <span className="text-gray-800">{retailer.name}</span>
                  </div>
                )}

                {/* Phone */}
                {retailer.contactNo && (
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-600 min-w-[100px]">Phone:</span>
                    <span className="text-gray-800">{retailer.contactNo}</span>
                  </div>
                )}

                {/* Email */}
                {retailer.email && (
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-600 min-w-[100px]">Email:</span>
                    <span className="text-gray-800 break-all">{retailer.email}</span>
                  </div>
                )}

                {/* Shop Type */}
                {retailer.shopDetails?.shopType && (
                  <div className="flex items-start">
                    <span className="font-semibold text-gray-600 min-w-[100px]">Shop Type:</span>
                    <span className="text-gray-800">{retailer.shopDetails.shopType}</span>
                  </div>
                )}

                {/* Address */}
                {retailer.shopDetails?.shopAddress && (
                  <div className="flex items-start col-span-full">
                    <span className="font-semibold text-gray-600 min-w-[100px]">Address:</span>
                    <span className="text-gray-800">
                      {[
                        retailer.shopDetails.shopAddress.address,
                        retailer.shopDetails.shopAddress.address2,
                        retailer.shopDetails.shopAddress.city,
                        retailer.shopDetails.shopAddress.state,
                        retailer.shopDetails.shopAddress.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-gray-500 font-medium">No outlets assigned yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Contact your admin to get outlets assigned to this campaign
          </p>
        </div>
      )}
    </div>
  );
};

export default OutletsAssigned;
