import React from "react";

// Network Data
const networkData = {
    "Andaman and Nicobar Islands": [
        "Port Blair"
    ],

    "Andhra Pradesh": [
        "Adoni", "Amalapuram", "Amaravati", "Anakapalle", "Anantapur", "Bhimavaram",
        "Chandragiri", "Chittoor", "Dowlaiswaram", "Eluru", "Gudivada",
        "Guntur", "Kadapa", "Kakinada", "Kurnool", "Machilipatnam",
        "Nagarjunakonda", "Narasaraopeta", "Nellore", "Ongole", "Parvathipuram",
        "Rajahmundry", "Srikakulam", "Tanuku", "Tadepalligudem", "Tirupati",
        "Tuni", "Vijayawada", "Visakhapatnam", "Vizianagaram", "Yemmiganur"
    ],

    "Arunachal Pradesh": ["Itanagar"],

    "Assam": [
        "Dhuburi", "Dibrugarh", "Dispur", "Guwahati", "Jorhat",
        "Nagaon", "Nalbari", "Sarthebari", "Silchar", "Sivasagar",
        "Tezpur", "Tinsukia"
    ],

    "Bihar": [
        "Ara", "Barauni", "Begusarai", "Bettiah", "Bhagalpur", "Bihar Sharif",
        "Bodh Gaya", "Buxar", "Chapra", "Darbhanga", "Dehri", "Dinapur Nizamat",
        "Gaya", "Hajipur", "Jamalpur", "Katihar", "Madhubani", "Motihari",
        "Munger", "Muzaffarpur", "Patna", "Purnia", "Pusa", "Saharsa",
        "Samastipur", "Sasaram", "Sitamarhi", "Siwan"
    ],

    "Chandigarh": ["Chandigarh"],

    "Chhattisgarh": [
        "Ambikapur", "Bhilai", "Bilaspur", "Dhamtari",
        "Durg", "Jagdalpur", "Raipur", "Rajnandgaon"
    ],

    "Dadra and Nagar Haveli and Daman and Diu": [
        "Daman", "Diu", "Silvassa"
    ],

    "Delhi": ["New Delhi"],

    "Goa": ["Madgaon", "Panaji"],

    "Gujarat": [
        "Ahmedabad", "Amreli", "Anand", "Bharuch", "Bhavnagar",
        "Bhuj", "Vadodara", "Dwarka", "Gandhinagar", "Godhra", "Jamnagar",
        "Junagadh", "Kandla", "Khambhat", "Kheda", "Kutch", "Mahesana",
        "Morbi", "Nadiad", "Navsari", "Okha", "Palanpur", "Patan",
        "Porbandar", "Rajkot", "Surat", "Surendranagar", "Valsad",
        "Veraval", "Vapi"
    ],

    "Haryana": [
        "Ambala", "Bhiwani", "Faridabad", "Firozpur Jhirka", "Gurgaon",
        "Hansi", "Hisar", "Jind", "Kaithal", "Karnal", "Kurukshetra",
        "Palwal", "Panchkula", "Panipat", "Pehowa", "Rewari",
        "Rohtak", "Sirsa", "Sonipat"
    ],

    "Himachal Pradesh": [
        "Chamba", "Dalhousie", "Dharmshala", "Kangra", "Kullu",
        "Mandi", "Nahan", "Shimla", "Una"
    ],

    "Jammu and Kashmir": [
        "Anantnag", "Baramula", "Doda", "Gulmarg", "Jammu", "Kathua",
        "Punch", "Rajouri", "Srinagar", "Udhampur"
    ],

    "Jharkhand": [
        "Bokaro", "Chaibasa", "Deoghar", "Dhanbad", "Dumka", "Giridih",
        "Hazaribag", "Jamshedpur", "Jharia", "Rajmahal", "Ranchi",
        "Saraikela"
    ],

    "Karnataka": [
        "Badami", "Ballari", "Bangalore", "Belagavi",
        "Bhadravati", "Bidar", "Chikkaballapur", "Chikkamagaluru",
        "Chitradurga", "Davangere", "Gulbarga", "Halebid", "Hassan",
        "Hubballi-Dharwad", "Kalaburagi", "Kolar", "Madikeri",
        "Mandya", "Mangaluru", "Mysuru",
        "Raichur", "Shivamogga", "Shravanabelagola", "Shrirangapattana",
        "Tumakuru", "Udupi", "Vijayapura"
    ],

    "Kerala": [
        "Alappuzha", "Kozhikode", "Ernakulam",
        "Idukki", "Iritty", "Kannur", "Kochi", "Kollam", "Kottakkal",
        "Kottayam", "Malappuram", "Mattancheri", "Palakkad",
        "Pathanamthitta", "Thalassery", "Thrissur", "Thiruvananthapuram",
        "Tirur", "Vatakara", "Wayanad"
    ],

    "Ladakh": ["Kargil", "Leh"],

    "Madhya Pradesh": [
        "Balaghat", "Barwani", "Betul", "Bhind", "Bharhut",
        "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh",
        "Datia", "Dewas", "Dhar", "Dr. Ambedkar Nagar (Mhow)", "Guna",
        "Gwalior", "Hoshangabad", "Indore", "Itarsi", "Jabalpur",
        "Jhabua", "Khajuraho", "Khandwa", "Khargone", "Maheshwar",
        "Mandla", "Mandsaur", "Morena", "Murwara", "Narsimhapur",
        "Narsinghgarh", "Narwar", "Neemuch", "Nowgong", "Orchha",
        "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa",
        "Sagar", "Sarangpur", "Satna", "Sehore", "Seoni", "Shahdol",
        "Shajapur", "Sheopur", "Shivpuri", "Ujjain", "Vidisha"
    ],

    "Maharashtra": [
        "Ahmadnagar", "Akola", "Amravati", "Aurangabad", "Bhandara",
        "Bhusawal", "Bid", "Buldhana", "Chandrapur", "Daulatabad",
        "Dhule", "Jalgaon", "Kalyan", "Karli", "Kolhapur", "Mahabaleshwar",
        "Malegaon", "Matheran", "Mumbai", "Nagpur", "Nanded", "Nashik",
        "Osmanabad", "Pandharpur", "Parbhani", "Pune",
        "Ratnagiri", "Sangli", "Satara", "Sevagram", "Solapur",
        "Thane", "Ulhasnagar", "Vasai-Virar", "Wardha", "Yavatmal"
    ],

    "Manipur": ["Imphal"],

    "Meghalaya": ["Cherrapunji", "Shillong"],

    "Mizoram": ["Aizawl", "Lunglei"],

    "Nagaland": ["Kohima", "Mon", "Phek", "Wokha", "Zunheboto"],

    "Odisha": [
        "Angul", "Balangir", "Baleshwar", "Barbil", "Baripada",
        "Bhubaneswar", "Bhadrak", "Brahmapur", "Cuttack",
        "Dhenkanal", "Jajpur", "Jajpur Road", "Jharsuguda", "Kendujhar",
        "Konark", "Koraput", "Paradip", "Phulabani", "Puri",
        "Rajgangpur", "Rayagada", "Rourkela", "Sambalpur", "Udayagiri"
    ],

    "Puducherry": [
        "Karaikal", "Mahe", "Puducherry", "Yanam"
    ],

    "Punjab": [
        "Amritsar", "Batala", "Faridkot", "Firozpur", "Gurdaspur",
        "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
        "Mohali", "Nabha", "Patiala", "Rupnagar", "Sangrur", "Zirakpur"
    ],

    "Rajasthan": [
        "Abu", "Ajmer", "Alwar", "Amer", "Barmer", "Beawar", "Bharatpur",
        "Bhilwara", "Bikaner", "Bundi", "Chittaurgarh", "Churu",
        "Dhaulpur", "Dungarpur", "Ganganagar", "Hanumangarh", "Jaipur",
        "Jaisalmer", "Jalor", "Jhalawar", "Jhunjhunu", "Jodhpur",
        "Kishangarh", "Kota", "Merta", "Nagaur", "Nathdwara",
        "Pali", "Phalodi", "Pushkar", "Sawai Madhopur", "Shahpura",
        "Sikar", "Sirohi", "Tonk", "Udaipur"
    ],

    "Sikkim": ["Gangtok", "Gyalshing", "Lachung", "Mangan"],

    "Tamil Nadu": [
        "Arcot", "Chengalpattu", "Chennai", "Chidambaram", "Coimbatore",
        "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Hosur",
        "Kanniyakumari", "Kanchipuram", "Kodaikanal", "Kumbakonam",
        "Madurai", "Nagapattinam", "Nagercoil", "Pudukkottai",
        "Rajapalayam", "Ramanathapuram", "Salem", "Tiruchchirappalli",
        "Tirunelveli", "Tiruppur", "Thoothukudi",
        "Udhagamandalam", "Vellore"
    ],

    "Telangana": [
        "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar",
        "Miryalaguda", "Nalgonda", "Nirmal", "Nizamabad",
        "Sangareddi", "Warangal"
    ],

    "Tripura": ["Agartala"],

    "Uttar Pradesh": [
        "Agra", "Aligarh", "Prayagraj", "Amroha", "Ayodhya", "Azamgarh",
        "Bahraich", "Ballia", "Banda", "Bara Banki", "Bareilly",
        "Basti", "Bijnor", "Bithur", "Budaun", "Bulandshahr",
        "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad",
        "Fatehpur", "Fatehpur Sikri", "Ghaziabad", "Ghazipur",
        "Gonda", "Gorakhpur", "Hardoi", "Hathras", "Jalaun",
        "Jaunpur", "Jhansi", "Kannauj", "Kanpur", "Lakhimpur",
        "Lalitpur", "Lucknow", "Mainpuri", "Mathura", "Meerut",
        "Mirzapur-Vindhyachal", "Moradabad", "Muzaffarnagar",
        "Noida", "Partapgarh", "Pilibhit", "Rae Bareli",
        "Rampur", "Saharanpur", "Sambhal", "Shahjahanpur",
        "Sitapur", "Sultanpur", "Tehri", "Unnao", "Varanasi"
    ],

    "Uttarakhand": [
        "Almora", "Dehradun", "Haridwar", "Haldwani",
        "Mussoorie", "Nainital", "Pithoragarh"
    ],

    "West Bengal": [
        "Alipore", "Alipur Duar", "Asansol", "Baharampur",
        "Bally", "Balurghat", "Bankura", "Baranagar", "Barasat",
        "Barrackpore", "Basirhat", "Bhatpara", "Birbhum", "Bishnupur",
        "Budge Budge", "Burdwan", "Cooch Behar", "Darjeeling",
        "Diamond Harbour", "Dum Dum", "Durgapur", "Halisahar",
        "Haora", "Hugli", "Ingraj Bazar", "Jalpaiguri", "Kalimpong",
        "Kamarhati", "Kanchrapara", "Kharagpur", "Kolkata",
        "Krishnanagar", "Malda", "Midnapore", "Murshidabad",
        "Nabadwip", "Palashi", "Panihati", "Purulia", "Raiganj",
        "Santipur", "Shantiniketan", "Shrirampur", "Siliguri",
        "Siuri", "Tamluk", "Titagarh", "Berhampore", "Haldia"
    ]
};

const ReachCoverage = () => {
    return (
        <section className="bg-black text-white py-20 px-6 md:px-20">

            <h2 className="text-center text-4xl md:text-5xl font-extrabold mb-14">
                Reach & <span className="text-red-500">Coverage</span>
            </h2>

            {Object.entries(networkData).map(([state, cities]) => (
                <div key={state} className="mb-10">

                    {/* STATE NAME */}
                    <h3 className="text-2xl font-bold text-red-500 mb-6">
                        {state}
                    </h3>

                    {/* CITIES GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {cities.sort().map((city, index) => (
                            <p
                                key={`${city}-${index}`}
                                className="text-gray-300 hover:text-red-500 hover:underline hover:font-semibold transition cursor-pointer"
                            >
                                {city}
                            </p>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
};

export default ReachCoverage;
