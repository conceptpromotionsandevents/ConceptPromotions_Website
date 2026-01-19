import React from "react";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
    return (
        <div className="overflow-x-hidden bg-gradient-to-t from-black via-gray-900 to-red-950 min-h-screen">
            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="pt-32 pb-16 px-6 md:px-32 text-center"
            >
                <h1 className="text-4xl md:text-5xl font-bold text-red-500 mb-4">
                    Privacy Policy
                </h1>
                <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                    Your privacy is important to us. This policy outlines how Concept Promotions & Events collects, uses, and protects your information.
                </p>
            </motion.section>

            {/* Privacy Policy Content */}
            <div className="pb-16 px-6 md:px-32 mx-auto">
                {/* Section 1: GENERAL */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        GENERAL
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">1.1.</strong> This Privacy Policy shall be read together with the other policies published by us on the Platform, including without limitation the terms of use, the disclaimer and any other applicable polices (together the "Policies"). The Policies describes our policies and procedures on the collection, use, storage and disclosure of any information including, business or personal information provided by you while using our Platform. This Policy specifically governs (i) the collection and use of PII (defined hereinbelow) and/or NPI (defined hereinbelow) provided by you; and (ii) the processing of PII and/or NPI by you while using our Platform. The Policies are published in accordance with Rule 3(1)(a) of the Information Technology (Intermediaries Guidelines and Digital Medial Ethics Code) Rules, 2021, which requires the publication of rules and regulations, privacy policy and terms of service for access or usage of the Platform.
                        </p>

                        <p>
                            <strong className="text-white">1.2.</strong> The terms "CPE" shall refer to Concept promotions and Events having office at 507, Kushal Bazaar, Nehru place, New Delhi-110019, and the terms "you/your" shall refer to the users and any other persons accessing or seeking to use the Platform (defined hereinbelow).
                        </p>

                        <p>
                            <strong className="text-white">1.3.</strong> This privacy policy is an electronic record in the form of an electronic contract drafted under the (Indian) Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data of Information) Rules, 2011, as amended from time to time ("Privacy Policy"). This Privacy Policy is an electronic document and does not require any physical, electronic or digital signature. By accessing or using the Platform (defined hereinbelow), you indicate that you understand, agree and consent to the terms and conditions contained in the Privacy Policy. If you do not agree with the terms and conditions of this Privacy Policy, please do not use this Platform (defined hereinbelow).
                        </p>

                        <p>
                            <strong className="text-white">1.4.</strong> This Privacy Policy is a legal agreement between between you and CPE which governs the usage, collection, protection and sharing of any information that you provide us, when you access and/or use our website located at <a href="http://conceptpromotions.in/" className="text-red-400 hover:text-red-300 underline">http://conceptpromotions.in/</a> and our mobile application SUPREME (or "App") (collectively, the "Platform"). This Privacy Policy is only applicable to the users of the Platform and the information and data gathered from the users and not to any other information or website. You are hereby advised to read this Privacy Policy carefully and fully understand the nature and purpose of gathering and/or collecting sensitive, personal and other information and the usage, disclosure and sharing of such information.
                        </p>
                    </div>
                </motion.div>

                {/* Section 2: OPERATING SYSTEM PERMISSIONS */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        2. OPERATING SYSTEM PERMISSIONS
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">2.1.</strong> Android mobile platforms have defined certain types of device data that apps cannot access without your consent. These platforms have different permission systems for obtaining your consent. Android devices will notify you of the permissions that our App seeks before you first use the App, and your use of the App constitutes your consent. Sometimes these permissions require more explanation than the Platforms themselves provide, and the permissions we request will change over time.
                        </p>

                        <p>
                            <strong className="text-white">2.2. Android permissions:</strong>
                        </p>

                        <div className="pl-6 space-y-4">
                            <p>
                                <strong className="text-white">(a) Device and App history:</strong> We need your device permission to get information about your device, like OS name, OS version, mobile network, hardware model, preferred language, installed apps etc. Based on these inputs, we intend to optimize your overall experience by understanding your preferences and by using OS specific capabilities.
                            </p>

                            <p>
                                <strong className="text-white">(b) Contacts:</strong> If you allow us to access your contacts, it enables us to make it easy to get referred by your friends and also send across referral links to your friends. This information will be stored on our servers and synced from your phone.
                            </p>

                            <p>
                                <strong className="text-white">(c) Camera:</strong> We need access to your camera for the purposes of our services including for determination of your attendance at a store.
                            </p>

                            <p>
                                <strong className="text-white">(d) Location:</strong> Please note that the App collects background location data to enable store geofence, data submission and store action even when the app is closed or not in use. Users are aware that we are getting their location and this feature is built in the App to monitor their presence in the stores. Managers manually check the users' location from the Platform/portal and ensure that users are working from their designated locations. Whenever a user submits data from the operations, we receive the address of the said user from a nearby location. It is mandatory for the user to provide location access to the App for smooth functioning.
                            </p>

                            <p>
                                <strong className="text-white">(e) Wi-Fi:</strong> When you allow us the permission to detect your Wi-Fi connection, we optimize your experience based on the connection speed.
                            </p>

                            <p>
                                <strong className="text-white">(f) Device ID & call information:</strong> This permission is used to detect your Android ID through which we can uniquely identify users. Please note that the App requires phone number for account management and user verification. Please note your phone number is stored by us is shared with our group companies and affiliates. For the said purposes, by using the Platform, you hereby give your consent to such sharing and/or usage of your phone number.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Section 3: TYPES OF INFORMATION COLLECTED */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        3. TYPES OF INFORMATION COLLECTED BY US
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p className="text-white font-semibold">
                            3.1 Personally Identifiable Information ("PII")
                        </p>

                        <div className="pl-6 space-y-4">
                            <p>
                                <strong className="text-white">(a)</strong> PII, as used in information security and privacy laws, is information that can be used on its own or with other information to identify, contact, or locate a single person and/or an entity, or to identify an individual and/or entity in context and includes information such as name, email address, phone number, information about your mobile device, cardholder name and information linked to a business transaction.
                            </p>

                            <p>
                                <strong className="text-white">(b)</strong> When you use the Platform, CPE may collect information regarding your computer and mobile device such as internet protocol address, domain, host, location, mobile status and anonymous site statistical data. As part of our KYC process we capture your name, phone number and email id. These PII are essential for rendering our services to you. We may also use this information to customize our services based on such information as provided by you.
                            </p>

                            <p>
                                <strong className="text-white">(c)</strong> The Platforms are particularly designed for electronic commerce (e-commerce) and are predominantly used by business entities to facilitate transactions and orders on e-commerce platforms and such business use does not generally involve the collection of PII of individuals unless it is provided voluntarily by you. By using the Platform, you hereby represent, confirm and acknowledge that any PII of third party/individual provided by you has been provided with due consent from such third party/individual. Please note that PII submitted by you of such third party/individual who are not the users of this Platform, are retained by us for purposes of enhancing our services.
                            </p>

                            <p>
                                <strong className="text-white">(d)</strong> We also collect any information exchanged by you with us in the form of written communication, responses to emails, feedback provided, etc.
                            </p>

                            <p>
                                <strong className="text-white">(e)</strong> You have the right to request to discontinue our use of your PII and/or any third party/individual's PII provided by you. To withdraw your consent to our collection and processing of such information in future, you may do so by sending an email to <a href="mailto:manager@conceptpromotions.in" className="text-red-400 hover:text-red-300 underline">manager@conceptpromotions.in</a>
                            </p>
                        </div>

                        <p className="text-white font-semibold pt-4">
                            3.2 Non-Personal Information (NPI)
                        </p>

                        <div className="pl-6 space-y-4">
                            <p>
                                <strong className="text-white">(a)</strong> The platform also collect information in a form that does not permit direct association with any specific individual including without limitation the information of the browser you use, usage details and identifying technologies ("NPI"). NPI includes without limitation, referring/exit pages, anonymous usage data, and URLs, platform types, number of clicks, etc. We request you to note that when you access the Platform or receive emails or any communication from us, we along with our affiliated companies and permitted agents, may use cookies and/or pixel tags to collect information and store your online preferences.
                            </p>

                            <p>
                                <strong className="text-white">(b)</strong> If we do combine NPI with PII, then the combined information will be treated as PII for as long as it remains combined.
                            </p>

                            <p>
                                <strong className="text-white">(c)</strong> We use various technologies and/or third-party tools to collect NPI, including without limitation:
                            </p>

                            <div className="pl-6 space-y-4">
                                <p>
                                    <strong className="text-white">I. Cookies:</strong> A "cookie" is a name for tokens of information that is sent to your web browser, which is used only when you browse website. Cookies are used to help us better understand website usage in the aggregate to ascertain which areas or features of the Platform users prefer. We use cookies and tracking technology depending on the services opted for by the user. No PII will be collected via cookies and other tracking technology; however, if you have previously provided PII, cookies may be tied to such information. Aggregate cookie and tracking information may be shared with third parties.
                                </p>

                                <p>
                                    <strong className="text-white">II. Location:</strong> Please note that the App collects background location data to enable store geofence, data submission and store action even when the app is closed or not in use. Users are aware that we are getting their location and this feature is built in the App to monitor their presence in the stores. Managers manually check the users' location from the Platform/portal and ensure that users are working from their designated locations. Whenever a user submits data from the operations, we receive the address of the said user from a nearby location.
                                </p>

                                <p>
                                    <strong className="text-white">III. Log File Information:</strong> Our servers automatically collect limited information about your device's connection to the internet, including your IP address, when you visit our Platform. We automatically receive and log information from the Platform including but not limited to IP address, your device or computer's name, and your operating system. We may also collect log information from your device, including but not limited to your system, device's name, device's serial number or unique identification number (e.g., Android ID or ADID on your android device) and your device operating system,. This information helps us facilitate the provision of software updates and other services to you. We may use this information, among other things, to improve our services or technologies
                                </p>

                                <p>
                                    <strong className="text-white">IV. Web beacon or other technologies:</strong> We often use web beacon in conjunction with cookies, to enhance our services on a number of pages of the Platform. A non-identifiable notice of a visitor's visit to a page on the Platform is generated and recorded. Such notice may be processed by us or our third-party associates. To disable some of these features, you may disable cookies in your web browser's settings. Web beacon and other technologies will still detect visits to these pages, but the notices they generate are disregarded and cannot be associated with other non-identifiable cookie information.
                                </p>

                                <p>
                                    <strong className="text-white">V. Google Analytics or other tools:</strong> Our Platform uses certain third-party tools (including but not limited to Google Analytics), in order to evaluate your use of our Platform, and to provide other services relating to the Platform activity, among other things.
                                </p>
                            </div>

                            <p>
                                <strong className="text-white">(d)</strong> We may also collect other non-specific information to provide you better access to our services each time, such as preferences and interests and other non-personal details via the Platform, any application form or email or any other medium. We may also store and publish such information to assist us in making the Platform better and easier to use.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Section 4: INFORMATION USAGE AND SHARING */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        4. INFORMATION USAGE AND SHARING
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">4.1.</strong> Our primary goal in collecting the information is for us to render our services to you, and to ensure quality and efficiency in the services provided to you. We may also use such information to verify whether you are entitled to access and use the Platform and the services made available through the Platform. Additionally, we will also be using the information for our internal operational purposes, such as providing, maintaining, evaluating, and improving the Platform and our services, and also for providing customer support. We would also be sharing the information with others in the manner provided in this Privacy Policy.
                        </p>

                        <p>
                            <strong className="text-white">4.2.</strong> By using the Platforms or by making use of the facilities provided by it and/or by providing your information, you consent to the collection and use of the information you disclose in accordance with this Privacy Policy, including but not limited to your consent for sharing your information as per this Privacy Policy. You further agree that such collection, use, storage and transfer of information shall not cause any loss or wrongful gain to you or any other person.
                        </p>

                        <p>
                            <strong className="text-white">4.3.</strong> We are both a data controller and a data processor.
                        </p>

                        <p>
                            <strong className="text-white">4.4.</strong> We may share your PII and/or NPI with third parties in the following circumstances:
                        </p>

                        <div className="pl-6 space-y-4">
                            <p>
                                <strong className="text-white">(a)</strong> To enable business entities or persons to process PII and/or NPI on our behalf or in connection with our services. We require that these parties agree to process such information based on our instructions and with appropriate confidentiality and security measures;
                            </p>

                            <p>
                                <strong className="text-white">(b)</strong> We have a good faith belief that access, use, preservation or disclosure of such PII and/or NPI is reasonably necessary to: (i) satisfy any applicable law, regulation, legal process or enforceable governmental request including to law enforcement and in response to a court order, (ii) detect, prevent, or otherwise address fraud, technical or security issues, (iii) enforce applicable Policies of the Platform, which may be further extended to investigation of potential violations thereof, or (iv) protect against harm to our rights, safety or property, our users or the public as required or permitted by law;
                            </p>

                            <p>
                                <strong className="text-white">(c)</strong> To protect ourselves against third-party claims;
                            </p>

                            <p>
                                <strong className="text-white">(d)</strong> Is necessary for performance of a contract between you and us;
                            </p>

                            <p>
                                <strong className="text-white">(e)</strong> To any member of our related or group companies including our subsidiaries, our ultimate holding company and its subsidiaries, as the case may be.
                            </p>

                            <p>
                                <strong className="text-white">(f)</strong> In the event that we sell or buy any business or assets, we may disclose your PPI and/or NPI to the prospective seller or buyer of such business or assets. User, email, and visitor information is generally one of the transferred business assets in these types of transactions. We may also transfer or assign such information in the course of corporate re-organization. corporate divestitures, mergers, acquisition, sale of business and/or dissolution.
                            </p>

                            <p>
                                <strong className="text-white">(g)</strong> We may partner with third-party entities to provide you with additional services related to our business or other programs that involve third parties, and this impliedly authorizes us to share your PII and/or NPI with those parties. A third party's use of your information is bound by contracts and agreements between us and the third party. We only share information reasonably needed to provide the additional services/benefits. By sharing information with us, you agree that we are not liable or responsible, directly or indirectly, for the actions or inactions of third parties;
                            </p>

                            <p>
                                <strong className="text-white">(h)</strong> We may disclose/share information to third-parties who support our business, such as those providing technical infrastructure services, analysing how our services are used, measuring the effectiveness of advertisements, providing customer support and business support services, facilitating payments, or conducting research and surveys, and the information will be used for the limited purposes of such services received by us.
                            </p>

                            <p>
                                <strong className="text-white">(i)</strong> We may also provide your information to our partners, associates, advertisers, service providers or other third parties to provide, advertise or market their legitimate products and/or services which may be of your interest. You will have the choice to 'opt out' of such marketing or promotional communications at your will.
                            </p>

                            <p>
                                <strong className="text-white">(j)</strong> We also use your contact information to send you offers based on your previous orders and interests.
                            </p>

                            <p>
                                <strong className="text-white">(k)</strong> We use PII to provide you with services you explicitly request for, to resolve disputes, troubleshoot concerns, help promote safe services, collect payment, measure interest of various users of our services, send important information, services, updates, customize your experience, detect and protect against error and fraud, enforce our terms and conditions, etc.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Section 5: LINKS TO/FROM THIRD-PARTY WEBSITES */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        5. LINKS TO/FROM THIRD-PARTY WEBSITES
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">5.1</strong> The Platform may contain links to third-party websites, products, and services. Information collected by third parties, which may include without limitation information such as location data or contact details, is governed by the privacy practices undertaken by such third parties. The provision of such links does not signify our endorsement of such other websites or locations or its contents. We have no control over, do not review, and cannot be responsible for these outside websites or their content. Please be aware that the terms of this Privacy Policy do not apply to these outside websites or locations or their content. We encourage you to learn about the privacy practices of those third parties. We expressly assert that we cannot be responsible for these practices and cannot be made liable, directly or indirectly, for these practices.
                        </p>

                        <p>
                            <strong className="text-white">5.2</strong> We may have presence on social networking websites including but not limited to LinkedIn, Facebook, Twitter, YouTube, Telegram, Instagram and blogs which are promotional and business initiatives to attract, engage and connect to a larger group of people. The domain links contained therein may either direct you to our Platform or request your participation by way of feedback, suggestions, etc. We, in this regard, fully disclaim any liability(ies) or claim(s), which may arise by use/misuse of your feedback, suggestions, views, etc. on any of the aforementioned networking websites or blogs, by any third party whether or not known to us.
                        </p>
                    </div>
                </motion.div>

                {/* Section 6: INFORMATION SECURITY & RETENTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        6. INFORMATION SECURITY & RETENTION
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">6.1.</strong> We take precautions including without limitation, administrative and technical measures to safeguard your personal information against loss, misuse or theft, as well as against destruction, alteration, disclosure and unauthorized access.
                        </p>

                        <p>
                            <strong className="text-white">6.2.</strong> For this purpose, we adopt internal reviews of the data collection, storage and processing practices and security measures, including appropriate encryption and physical security measures to guard against unauthorized access to systems, where we store your PII. Specifically, while we will ensure our best efforts to protect your information in line with commercially reasonable efforts and general industry standards; however, we do not represent, warrant, or guarantee that your information will be protected against unauthorized access, loss, misuse or alterations.
                        </p>

                        <p>
                            <strong className="text-white">6.3.</strong> We recognize industry standards and employ security safeguards to protect PII from unauthorized access and misuse. All information you provide to us is stored on secure servers. Any payment transactions will be protected and safeguarded by encryption during data transit and storage by specific safeguards and security measures. We will not disclose to third parties any PII that you provide without your consent, except as necessary to provide services you have specifically requested and as specifically mentioned in this Policy. Once we have received your information, we will use industry standard procedures and security features to try to prevent unauthorized access to that information.
                        </p>

                        <p>
                            <strong className="text-white">6.4.</strong> When you use our services or the Platform, some of the PII you share may be visible to other users and can be read, collected, or used by them. You are responsible for such PII you choose to submit in these instances. Further, you are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer/mobile systems, and you agree to accept responsibility for all activities that occur under your account or password.
                        </p>

                        <p>
                            <strong className="text-white">6.5.</strong> Notwithstanding anything contained in this Privacy Policy or elsewhere, we shall not be held responsible for any loss, damage or misuse of your PII and/or NPI, if such loss, damage or misuse is attributable to a Force Majeure Event (defined below):.
                        </p>

                        <p>
                            <strong className="text-white">6.6.</strong> A "Force Majeure Event" shall mean any event that is beyond our reasonable control and shall include, without limitation, sabotage, fire, flood, earthquakes, explosion, acts of God, civil commotion, strikes or industrial action of any kind, riots, insurrection, war, acts of government, computer hacking, unauthorised access to computer, computer system or computer network, computer crashes, breach of security and encryption (provided it is beyond our reasonable commercial control), power or electricity failure or unavailability of adequate power or electricity
                        </p>

                        <p>
                            <strong className="text-white">6.7.</strong> While we will endeavour to take all reasonable and appropriate steps to keep secure any PII and/or NPI which we hold about you and prevent unauthorized access, you acknowledge that the internet or computer networks are not fully secure and that we cannot provide any absolute assurance regarding the security of your PII. Please exercise reasonable caution when determining what information you disclose via the Platform. The transmission of information via the internet is not completely secure. Although we will do our best to protect your personal data, we cannot guarantee the security of your data transmitted to the Platform. Any transmission of data is at your risk.
                        </p>

                        <p>
                            <strong className="text-white">6.8.</strong> You understand and agree that the we may continue to store your information after you cease to use the services or disable your use of, or access to the services or the Platform. Please note that we may, share and/or disclose your PII with third parties, after you cease to use our services or disable your use of, or access to the services or the Platform. NPI will be retained indefinitely, and we may continue to use, share and/or disclose your NPI in furtherance of our Policies.
                        </p>

                        <p>
                            <strong className="text-white">6.9.</strong> You acknowledge and agree that we reserve the right to remove or edit content, refuse services, terminate accounts, or cancel plans at our sole discretion.
                        </p>
                    </div>
                </motion.div>

                {/* Section 7: YOUR RIGHTS */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        7. YOUR RIGHTS RELATING TO THE INFORMATION
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">7.1</strong> The right of access – this is your right to see what information is held about you by us.
                        </p>

                        <p>
                            <strong className="text-white">7.2</strong> The right to rectification – this is your right to have your information corrected or amended if what is held is incorrect in some way.
                        </p>

                        <p>
                            <strong className="text-white">7.3</strong> The right to erasure – this is your right to ask for your personal information to be deleted under certain circumstances. This applies if the personal information is no longer required for the purposes it was collected for, or your consent for the processing of that information has been withdrawn, or the personal information has been unlawfully processed. We will usually inform you (before collecting your data) if we intend to use your data for marketing purposes or if we intend to disclose any of your information to any third party for such purposes.
                        </p>
                    </div>
                </motion.div>

                {/* Section 8: GRIEVANCE */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        8. GRIEVANCE
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">8.1.</strong> In case of breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, personal data transmitted, stored or otherwise processed, we have the mechanisms and policies in place in order to identify it and assess it promptly. Depending on the outcome of our assessment, we will make the requisite notifications to the supervisory authorities and communications to the affected data subjects, which might include you.
                        </p>

                        <p>
                            <strong className="text-white">8.2.</strong> In accordance with the (Indian) Information Technology Act, 2000 and other legal requirements, the name and contact details of the Grievance Officer who can be contacted with respect to any complaints or concerns including those pertaining to breach of this Privacy Policy and other Polices are published as under:
                        </p>

                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 my-4">
                            <p className="text-white">
                                <strong>Grievance Officer Name:</strong> ABHIJIT CHOWDHURY<br />
                                <strong>Email address:</strong> <a href="mailto:manager@conceptpromotions.in" className="text-red-400 hover:text-red-300 underline">manager@conceptpromotions.in</a>
                            </p>
                        </div>

                        <p>
                            <strong className="text-white">8.3.</strong> The Grievance Officer can be contacted between 10am to 5pm from Monday to Friday except on public holidays.
                        </p>
                    </div>
                </motion.div>

                {/* Section 9: GOVERNING LAW */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        9. GOVERNING LAW
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">9.1.</strong> We are incorporated in, and based out of the Republic of India, and we are duty bound to abide by Indian laws. We may not have complied with some privacy laws of other countries and further represent to be unaware of such other legal requirements.
                        </p>

                        <p>
                            <strong className="text-white">9.2.</strong> Further, any disputes regarding this Privacy Policy shall be subject to the jurisdiction of the courts of NCT of Delhi, India.
                        </p>
                    </div>
                </motion.div>

                {/* Section 10: CONTACT INFORMATION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        10. QUESTIONS AND CONTACT INFORMATION
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">10.1.</strong> If you would like to access, correct, amend or delete any of your information shared with us, please register a complaint, or if you want more information about this Privacy Policy, please contact us at <a href="mailto:manager@conceptpromotions.in" className="text-red-400 hover:text-red-300 underline">manager@conceptpromotions.in</a>. We shall respond to and address all reasonable concerns or inquiries in a reasonable amount of time.
                        </p>
                    </div>
                </motion.div>

                {/* Section 11: POLICY UPDATES */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-500">
                        11. UPDATES TO THE PRIVACY POLICY
                    </h2>

                    <div className="space-y-6 text-gray-300 leading-relaxed text-base md:text-lg">
                        <p>
                            <strong className="text-white">11.1.</strong> We reserve the right to modify, amend, suspend, terminate or replace this Privacy Policy from time to time within our sole and absolute discretion. We will post any changes made to the Privacy Policy on the Platform without prior notice to you. Such changes will take effect immediately upon their posting on the Platform. If You do not agree with the revisions, please discontinue the use of this Platform.
                        </p>

                        <p>
                            <strong className="text-white">11.2.</strong> We encourage you to review the Privacy Policy frequently. By your continued use of the Platform, you consent to the terms of the revised/updated Privacy Policy.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
