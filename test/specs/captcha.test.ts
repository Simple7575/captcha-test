describe("My Login application", () => {
    it("should login with valid credentials", async () => {
        await browser.url("https://www.google.com/recaptcha/api2/demo");
        // await browser.url("https://phptravels.org/login");
        // await browser.url("https://test-form-s.netlify.app");

        const frame = await $('iframe[title="reCAPTCHA"]');
        await browser.switchToFrame(frame);
        const checkbox = await $("span[role='checkbox']");

        await checkbox.click();

        await browser.pause(3000);

        await browser.switchToParentFrame();
        // <button class="rc-button goog-inline-block rc-button-audio" title="Get an audio challenge" value="" id="recaptcha-audio-button" tabindex="1"></button>
        // <button class="rc-button-default goog-inline-block" title="" value="" id=":2" tabindex="0" aria-labelledby="audio-instructions rc-response-label">PLAY</button>
        // <input type="text" id="audio-response" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" dir="ltr" class="rc-response-input-field label-input-label" aria-labelledby="rc-response-input-label">
        // <button class="rc-button-default goog-inline-block" title="" value="" id="recaptcha-verify-button" tabindex="0">Verify</button>
        // <audio id="audio-source" src="https://www.google.com/recaptcha/api2/payload?p=06AFcWeA5YOfpGkz2DyuymzU0t-Dd0hHjf6B2--nRIx9bY58LAUFhZiBSZDdrddvTCC9U-MeD6yu0UPCb0vHWwQjk2RY69PDn5nhDaSVWULYLM9ttmXyMjY9FXim6-rO35uHcuyibwvtKK5owjjIfcbZdkp-VnSax82wpjJQdFVb0e9OKQ9XapPBNrh-4wGdOdrkG2zBYI0JjGjwApSbFGqCiJmBbbpka9xIfvMdPUSJK_70MCvLkogMw&amp;k=6LfCJLceAAAAAJ_1NHWzOK2v5Uu60D5aQ6ACiq4R" style="display: none"></audio>

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
