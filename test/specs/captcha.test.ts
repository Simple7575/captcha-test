describe("My Login application", () => {
    it("should login with valid credentials", async () => {
        await browser.url("https://www.google.com/recaptcha/api2/demo");

        const frame = await $('iframe[title="reCAPTCHA"]');
        await browser.switchToFrame(frame);
        const checkbox = await $("span[role='checkbox']");

        await checkbox.click();

        await browser.pause(3000);

        await browser.switchToParentFrame();

        const frame2 = await $('iframe[title^="recaptcha"]');
        await frame2.waitForDisplayed();

        await browser.switchToFrame(frame2);

        const audioButton = await $("//button[@id='recaptcha-audio-button']");

        audioButton.click();

        await browser.pause(3000);

        await browser.execute(() => {
            // const audioElement = document.querySelector("#audio-source");
            const audioElement = document.querySelector("audio") as HTMLAudioElement;
            // const playButton = document.querySelector("#:2") as HTMLButtonElement;
            const input = document.querySelector("#audio-response");
            const submitButton = document.querySelector(
                "#recaptcha-verify-button"
            ) as HTMLButtonElement;

            let mediaRecorder: any;
            let audioChunks: any[] = [];

            // Start recording
            function startRecording() {
                // @ts-expect-error
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const mediaStreamDestination = audioContext.createMediaStreamDestination();

                const sourceNode = audioContext.createMediaElementSource(audioElement);
                sourceNode.connect(mediaStreamDestination);

                mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);

                mediaRecorder.ondataavailable = (event: any) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.start();
            }

            // Stop recording
            function stopRecording() {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" }); // Specify the desired format
                        // const audioUrl = URL.createObjectURL(audioBlob);

                        const reader = new FileReader();
                        reader.readAsDataURL(audioBlob);
                        reader.onload = () => {
                            const result = reader.result;

                            const base64 = (result as string).split(",")[1];

                            // const file = new File([audioBlob], "audio.mp3", { type: "audio/mp3" });

                            const formData = new FormData();

                            formData.append("base64", base64);

                            fetch("http://localhost:3000/audio-to-text", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ data: base64 }),
                            })
                                .then((res) => res.json())
                                .then((res) => {
                                    console.log(JSON.parse(res));
                                    if (!input) throw new Error("Input does not exist.");
                                    // @ts-expect-error
                                    input.value = JSON.parse(res).text;
                                    submitButton.click();
                                });
                        };
                    };
                }
            }

            if (!audioElement) throw new Error("Audio element does not exist");
            audioElement.play();
            // playButton.click();
            audioElement.addEventListener("play", startRecording);
            audioElement.addEventListener("ended", stopRecording);
        });

        await browser.debug();
    });
});
