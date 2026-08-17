document.addEventListener("DOMContentLoaded", function () {


    // =====================================================
    // TALK TO A NURSE - CONTINUE BUTTON
    // =====================================================

    const continueButton =
        document.getElementById("continue-button");

    const situationSection =
        document.getElementById("situation-section");

    const nurseResults =
        document.getElementById("nurse-results");


    if (continueButton) {

        continueButton.addEventListener("click", function () {

            const situation =
                document.getElementById("situation");


            if (
                situation &&
                situation.value.trim() === ""
            ) {

                alert(
                    "Please describe your situation before continuing."
                );

                situation.focus();

                return;

            }


            if (situationSection) {

                situationSection.style.display =
                    "none";

            }


            if (nurseResults) {

                nurseResults.style.display =
                    "block";


                nurseResults.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }

        });

    }



    // =====================================================
    // COMMUNICATION OPTIONS
    // =====================================================

    const communicationOptions =
        document.getElementById(
            "communication-options"
        );


    const chatButton =
        document.getElementById(
            "chat-button"
        );


    const voiceButton =
        document.getElementById(
            "voice-button"
        );


    const videoButton =
        document.getElementById(
            "video-button"
        );



    // =====================================================
    // COMMUNICATION INTERFACES
    // =====================================================

    const chatBox =
        document.getElementById(
            "chat-box"
        );


    const voiceBox =
        document.getElementById(
            "voice-box"
        );


    const videoBox =
        document.getElementById(
            "video-box"
        );



    // =====================================================
    // HIDE ALL COMMUNICATION INTERFACES
    // =====================================================

    function hideAllInterfaces() {

        if (chatBox) {

            chatBox.style.display =
                "none";

        }


        if (voiceBox) {

            voiceBox.style.display =
                "none";

        }


        if (videoBox) {

            videoBox.style.display =
                "none";

        }

    }



    // =====================================================
    // SHOW SELECTED COMMUNICATION INTERFACE
    // =====================================================

    function showInterface(interfaceBox) {


        if (communicationOptions) {

            communicationOptions.style.display =
                "none";

        }


        hideAllInterfaces();


        if (interfaceBox) {

            interfaceBox.style.display =
                "block";


            interfaceBox.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }



    // =====================================================
    // CHAT OPTION
    // =====================================================

    if (chatButton) {

        chatButton.addEventListener(
            "click",
            function () {

                showInterface(chatBox);

            }
        );

    }



    // =====================================================
    // VOICE CALL OPTION
    // =====================================================

    if (voiceButton) {

        voiceButton.addEventListener(
            "click",
            function () {

                showInterface(voiceBox);

            }
        );

    }



    // =====================================================
    // VIDEO CALL OPTION
    // =====================================================

    if (videoButton) {

        videoButton.addEventListener(
            "click",
            function () {

                showInterface(videoBox);

            }
        );

    }



    // =====================================================
    // BACK BUTTONS
    // =====================================================

    const backFromChat =
        document.getElementById(
            "back-from-chat"
        );


    const backFromVoice =
        document.getElementById(
            "back-from-voice"
        );


    const backFromVideo =
        document.getElementById(
            "back-from-video"
        );



    // =====================================================
    // SHOW COMMUNICATION OPTIONS AGAIN
    // =====================================================

    function showCommunicationOptions() {


        hideAllInterfaces();


        if (communicationOptions) {

            communicationOptions.style.display =
                "block";


            communicationOptions.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    }



    // =====================================================
    // BACK FROM CHAT
    // =====================================================

    if (backFromChat) {

        backFromChat.addEventListener(
            "click",
            function () {

                showCommunicationOptions();

            }
        );

    }



    // =====================================================
    // BACK FROM VOICE CALL
    // =====================================================

    if (backFromVoice) {

        backFromVoice.addEventListener(
            "click",
            function () {

                showCommunicationOptions();

            }
        );

    }



    // =====================================================
    // BACK FROM VIDEO CALL
    // =====================================================

    if (backFromVideo) {

        backFromVideo.addEventListener(
            "click",
            function () {

                showCommunicationOptions();

            }
        );

    }



    // =====================================================
    // CHAT FUNCTIONALITY
    // =====================================================

    const sendMessage =
        document.getElementById(
            "send-message"
        );


    const messageInput =
        document.getElementById(
            "message-input"
        );


    const chatMessages =
        document.getElementById(
            "chat-messages"
        );



    // =====================================================
    // SEND CHAT MESSAGE
    // =====================================================

    function sendChatMessage() {


        if (
            !messageInput ||
            !chatMessages
        ) {

            return;

        }


        const message =
            messageInput.value.trim();


        if (message === "") {

            alert(
                "Please type a message."
            );

            messageInput.focus();

            return;

        }



        // Create user message

        const userMessage =
            document.createElement(
                "div"
            );


        userMessage.className =
            "chat-message user-message";



        // Create user name

        const userName =
            document.createElement(
                "strong"
            );


        userName.textContent =
            "You:";



        // Create message paragraph

        const messageParagraph =
            document.createElement(
                "p"
            );


        messageParagraph.textContent =
            message;



        // Add content

        userMessage.appendChild(
            userName
        );

        userMessage.appendChild(
            messageParagraph
        );



        // Add message

        chatMessages.appendChild(
            userMessage
        );



        // Clear input

        messageInput.value = "";



        // Scroll to newest message

        chatMessages.scrollTop =
            chatMessages.scrollHeight;

    }



    // =====================================================
    // SEND BUTTON
    // =====================================================

    if (sendMessage) {

        sendMessage.addEventListener(
            "click",
            function () {

                sendChatMessage();

            }
        );

    }



    // =====================================================
    // ENTER KEY SENDS MESSAGE
    // =====================================================

    if (messageInput) {

        messageInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    sendChatMessage();

                }

            }
        );

    }



    // =====================================================
    // VOICE CALL
    // =====================================================

    const startVoiceCall =
        document.getElementById(
            "start-voice-call"
        );


    const endVoiceCall =
        document.getElementById(
            "end-voice-call"
        );


    if (
        startVoiceCall &&
        endVoiceCall
    ) {


        // START VOICE CALL

        startVoiceCall.addEventListener(
            "click",
            function () {


                startVoiceCall.style.display =
                    "none";


                endVoiceCall.style.display =
                    "inline-block";


                if (voiceBox) {

                    const status =
                        voiceBox.querySelector(
                            ".call-status"
                        );


                    if (status) {

                        status.textContent =
                            "Voice call connected with Nurse Thandi.";

                    }

                }

            }
        );



        // END VOICE CALL

        endVoiceCall.addEventListener(
            "click",
            function () {


                endVoiceCall.style.display =
                    "none";


                startVoiceCall.style.display =
                    "inline-block";


                if (voiceBox) {

                    const status =
                        voiceBox.querySelector(
                            ".call-status"
                        );


                    if (status) {

                        status.textContent =
                            "Voice call ended.";

                    }

                }

            }
        );

    }



    // =====================================================
    // VIDEO CALL
    // =====================================================

    const startVideoCall =
        document.getElementById(
            "start-video-call"
        );


    const endVideoCall =
        document.getElementById(
            "end-video-call"
        );


    if (
        startVideoCall &&
        endVideoCall
    ) {


        // START VIDEO CALL

        startVideoCall.addEventListener(
            "click",
            function () {


                startVideoCall.style.display =
                    "none";


                endVideoCall.style.display =
                    "inline-block";


                if (videoBox) {

                    const status =
                        videoBox.querySelector(
                            ".call-status"
                        );


                    if (status) {

                        status.textContent =
                            "Video call connected with Nurse Thandi.";

                    }

                }

            }
        );



        // END VIDEO CALL

        endVideoCall.addEventListener(
            "click",
            function () {


                endVideoCall.style.display =
                    "none";


                startVideoCall.style.display =
                    "inline-block";


                if (videoBox) {

                    const status =
                        videoBox.querySelector(
                            ".call-status"
                        );


                    if (status) {

                        status.textContent =
                            "Video call ended.";

                    }

                }

            }
        );

    }



    // =====================================================
    // PHOTO UPLOAD
    // =====================================================

    const photoInput =
        document.getElementById(
            "photo"
        );


    const fileName =
        document.getElementById(
            "file-name"
        );


    if (
        photoInput &&
        fileName
    ) {

        photoInput.addEventListener(
            "change",
            function () {


                if (
                    photoInput.files &&
                    photoInput.files.length > 0
                ) {


                    const selectedFile =
                        photoInput.files[0];


                    fileName.textContent =
                        "Selected file: " +
                        selectedFile.name;

                } else {

                    fileName.textContent =
                        "";

                }

            }
        );

    }



    // =====================================================
    // COMMUNITY PAGE
    // =====================================================

    const communityForm =
        document.getElementById(
            "community-form"
        );


    const communityStories =
        document.getElementById(
            "community-stories"
        );


    const experienceCount =
        document.getElementById(
            "experience-count"
        );


    const noStoriesMessage =
        document.getElementById(
            "no-stories-message"
        );



    // =====================================================
    // GET SAVED STORIES
    // =====================================================

    function getSavedStories() {

        const savedStories =
            localStorage.getItem(
                "momsHavenCommunityStories"
            );


        if (!savedStories) {

            return [];

        }


        try {

            return JSON.parse(
                savedStories
            );

        } catch (error) {

            return [];

        }

    }



    // =====================================================
    // SAVE STORIES
    // =====================================================

    function saveStories(stories) {

        localStorage.setItem(
            "momsHavenCommunityStories",
            JSON.stringify(stories)
        );

    }



    // =====================================================
    // UPDATE EXPERIENCE COUNT
    // =====================================================

    function updateExperienceCount(stories) {

        if (experienceCount) {

            experienceCount.textContent =
                stories.length;

        }

    }



    // =====================================================
    // DISPLAY STORIES
    // =====================================================

    function displayStories() {


        if (!communityStories) {

            return;

        }


        const stories =
            getSavedStories();


        updateExperienceCount(
            stories
        );


        // Remove old stories

        communityStories
            .querySelectorAll(
                ".community-story"
            )
            .forEach(function (story) {

                story.remove();

            });



        // Show message if there are no stories

        if (stories.length === 0) {

            if (noStoriesMessage) {

                noStoriesMessage.style.display =
                    "block";

            }

            return;

        }



        // Hide empty message

        if (noStoriesMessage) {

            noStoriesMessage.style.display =
                "none";

        }



        // Display stories

        stories.forEach(function (story) {

            const storyElement =
                document.createElement(
                    "article"
                );


            storyElement.className =
                "community-story";



            // Story header

            const storyHeader =
                document.createElement(
                    "div"
                );


            storyHeader.className =
                "story-header";



            // Author

            const author =
                document.createElement(
                    "div"
                );


            author.className =
                "story-author";


            author.textContent =
                story.name;



            // Location

            if (story.city) {

                const location =
                    document.createElement(
                        "div"
                    );


                location.className =
                    "story-location";


                location.textContent =
                    story.city;


                author.appendChild(
                    location
                );

            }



            storyHeader.appendChild(
                author
            );



            storyElement.appendChild(
                storyHeader
            );



            // Journey

            if (story.journey) {

                const journey =
                    document.createElement(
                        "p"
                    );


                journey.className =
                    "story-journey";


                journey.textContent =
                    story.journey;


                storyElement.appendChild(
                    journey
                );

            }



            // Experience

            const experience =
                document.createElement(
                    "p"
                );


            experience.className =
                "story-experience";


            experience.textContent =
                story.experience;


            storyElement.appendChild(
                experience
            );



            // Date

            if (story.date) {

                const date =
                    document.createElement(
                        "p"
                    );


                date.className =
                    "story-date";


                date.textContent =
                    "Shared on " +
                    story.date;


                storyElement.appendChild(
                    date
                );

            }



            // Add story to page

            communityStories.appendChild(
                storyElement
            );

        });

    }



    // =====================================================
    // COMMUNITY FORM SUBMISSION
    // =====================================================

    if (communityForm) {

        communityForm.addEventListener(
            "submit",
            function (event) {


                // Stop page from refreshing

                event.preventDefault();



                // Get form elements

                const nameElement =
                    document.getElementById(
                        "name"
                    );


                const cityElement =
                    document.getElementById(
                        "city"
                    );


                const journeyElement =
                    document.getElementById(
                        "journey"
                    );


                const experienceElement =
                    document.getElementById(
                        "experience"
                    );



                // Get values

                const name =
                    nameElement
                        ? nameElement.value.trim()
                        : "";


                const city =
                    cityElement
                        ? cityElement.value.trim()
                        : "";


                const journey =
                    journeyElement
                        ? journeyElement.value.trim()
                        : "";


                const experience =
                    experienceElement
                        ? experienceElement.value.trim()
                        : "";



                // Check required fields

                if (
                    name === "" ||
                    experience === ""
                ) {

                    alert(
                        "Please complete all required fields."
                    );

                    return;

                }



                // =================================================
                // CREATE NEW STORY
                // =================================================

                const newStory = {

                    name: name,

                    city: city,

                    journey: journey,

                    experience: experience,

                    date: new Date()
                        .toLocaleDateString(
                            "en-ZA",
                            {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            }
                        )

                };



                // =================================================
                // GET EXISTING STORIES
                // =================================================

                const stories =
                    getSavedStories();



                // =================================================
                // ADD NEW STORY
                // =================================================

                stories.push(
                    newStory
                );



                // =================================================
                // SAVE UPDATED STORIES
                // =================================================

                saveStories(
                    stories
                );



                // =================================================
                // UPDATE DISPLAY
                // =================================================

                displayStories();



                // =================================================
                // CLEAR FORM
                // =================================================

                communityForm.reset();



                // =================================================
                // SUCCESS MESSAGE
                // =================================================

                alert(
                    "Thank you for sharing your experience with the Mom's Haven community."
                );



                // =================================================
                // SCROLL TO STORIES
                // =================================================

                const communityVoices =
                    document.querySelector(
                        ".community-voices"
                    );


                if (communityVoices) {

                    communityVoices.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    }



    // =====================================================
    // LOAD COMMUNITY STORIES WHEN PAGE OPENS
    // =====================================================

    displayStories();


});