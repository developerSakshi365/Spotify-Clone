console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;
let currentPlayingLi = null;
const leftControl = document.getElementById("leftControl");
const rightControl = document.getElementById("rightControl");


function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        let songName = song.replaceAll("%20", " ");
        let li = document.createElement("li");
        li.innerHTML = `
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div>${songName}</div>
                <div></div>
            </div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="play-icon" src="img/play.svg" alt="">
            </div>`;

        let playIcon = li.querySelector(".play-icon");

        playIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            let selectedSong = li.querySelector(".info div").innerText.trim();

            if (currentPlayingLi === li) {
                if (currentSong.paused) {
                    currentSong.play();
                    playIcon.src = "img/pause.svg";
                    play.src = "img/pause.svg";
                } else {
                    currentSong.pause();
                    playIcon.src = "img/play.svg";
                    play.src = "img/play.svg";
                }
            } else {
                if (currentPlayingLi) {
                    currentPlayingLi.querySelector(".play-icon").src = "img/play.svg";
                }
                playMusic(selectedSong);
                playIcon.src = "img/pause.svg";
                play.src = "img/pause.svg";
                currentPlayingLi = li;
            }
        });

        li.addEventListener("click", () => {
            let selectedSong = li.querySelector(".info div").innerText.trim();
            if (currentPlayingLi && currentPlayingLi !== li) {
                currentPlayingLi.querySelector(".play-icon").src = "img/play.svg";
            }
            playMusic(selectedSong);
            playIcon.src = "img/pause.svg";
            play.src = "img/pause.svg";
            currentPlayingLi = li;
        });

        songUL.appendChild(li);
    }

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songInfo").innerHTML = decodeURI(track);
    document.querySelector(".songTime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("displaying albums");
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);
    let firstFolder = null;

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").filter(Boolean).pop();
            if (!firstFolder) firstFolder = folder;
            try {
                let info = await fetch(`/songs/${folder}/info.json`).then(res => res.json());
                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${info.title}</h2>
                        <p>${info.description}</p>
                    </div>`;
            } catch (err) {
                console.error("Failed to load info.json for", folder);
            }
        }
    }

    if (firstFolder) {
        songs = await getSongs(`songs/${firstFolder}`);
        if (songs.length > 0) {
            playMusic(songs[0]); // Auto play first song
            let songUL = document.querySelector(".songList ul");
            let firstLi = songUL.querySelector("li");
            if (firstLi) {
                firstLi.querySelector(".play-icon").src = "img/pause.svg";
                currentPlayingLi = firstLi;
            }
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            if (songs.length > 0) {
                playMusic(songs[0]);
                let songUL = document.querySelector(".songList ul");
                let firstLi = songUL.querySelector("li");
                if (firstLi) {
                    firstLi.querySelector(".play-icon").src = "img/pause.svg";
                    currentPlayingLi = firstLi;
                }
            }
        });
    });
}

async function main() {
    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
            if (currentPlayingLi) {
                currentPlayingLi.querySelector(".play-icon").src = "img/pause.svg";
            }
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
            if (currentPlayingLi) {
                currentPlayingLi.querySelector(".play-icon").src = "img/play.svg";
            }
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songTime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) {
            playMusic(songs[index - 1]);
            let songUL = document.querySelector(".songList ul");
            if (currentPlayingLi) {
                currentPlayingLi.querySelector(".play-icon").src = "img/play.svg";
            }
            currentPlayingLi = songUL.children[index - 1];
            currentPlayingLi.querySelector(".play-icon").src = "img/pause.svg";
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
            let songUL = document.querySelector(".songList ul");
            if (currentPlayingLi) {
                currentPlayingLi.querySelector(".play-icon").src = "img/play.svg";
            }
            currentPlayingLi = songUL.children[index + 1];
            currentPlayingLi.querySelector(".play-icon").src = "img/pause.svg";
        }
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });

    // Controls for caret icons
    const leftControl = document.getElementById("leftControl");
const rightControl = document.getElementById("rightControl");

// Controls for caret icons
leftControl.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index > 0) {
        playMusic(songs[index - 1]);
        let songUL = document.querySelector(".songList ul");
        if (currentPlayingLi) {
            currentPlayingLi.querySelector(".play-icon").src = "img/play.svg";
        }
        currentPlayingLi = songUL.children[index - 1];
        currentPlayingLi.querySelector(".play-icon").src = "img/pause.svg";
    }
});

rightControl.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").pop());
    if (index + 1 < songs.length) {
        playMusic(songs[index + 1]);
        let songUL = document.querySelector(".songList ul");
        if (currentPlayingLi) {
            currentPlayingLi.querySelector(".play-icon").src = "img/play.svg";
        }
        currentPlayingLi = songUL.children[index + 1];
        currentPlayingLi.querySelector(".play-icon").src = "img/pause.svg";
    }
});


}

main();
