import { useRef, useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  BsPlayFill,
  BsPauseFill,
  BsFillSkipStartFill,
  BsFillSkipEndFill,
  BsFillVolumeUpFill,
  BsFillVolumeMuteFill,
} from "react-icons/bs";
import { TbRepeatOnce, TbArrowsShuffle } from "react-icons/tb";

const Layout = ({
  userDetails,
  library,
  nowPlaying,
  setNowPlaying,
  isPlaying,
  setIsPlaying,
}) => {
  const handleRemoveWelcomeDiv = () => {
    document.getElementById("welcomeDiv").classList.add("hideWelcomeDiv");
    document.querySelector("body").classList.remove("hideOverflow");
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const [isMaximised, setIsMaximised] = useState(false);

  const handleNowPlayingSize = () => {
    document.querySelector("body").classList.toggle("hideOverflow");
    document.getElementById("nowPlaying").classList.toggle("maximised");
    setIsMaximised(!isMaximised);
  };

  // for audioplayer
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooped, setIsLooped] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isMuted, setIsMuted] = useState({ muted: false, prevVolume: 0 });

  // references to certain components
  const audioPlayer = useRef();
  const progressBar = useRef();
  const animationRef = useRef();
  const volumeBar = useRef();

  // updating progressBar everytime current time of audio changes
  useEffect(() => {
    const seconds = Math.floor(audioPlayer.current.duration); //get rid of decimals (round down)
    setDuration(seconds);
    progressBar.current.max = seconds; //states that the max of progress bar is .. seconds
  }, [audioPlayer?.current?.loadedmetadata, audioPlayer?.current?.readyState]); //occurs when audio has loaded and is ready?

  // convert playback seconds to ##:## time format
  const calculateTime = (seconds) => {
    const mins = Math.floor(seconds / 60); // convert seconds to mins
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`; //format minutes to ## or 0#
    const secs = Math.floor(seconds % 60); // calculate remaining seconds
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`; //format seconds to ## or 0#
    return `${formattedMins}:${formattedSecs}`;
  };

  // toggling between play and pause
  const togglePlayPause = () => {
    if (audioPlayer.current.src !== "") {
      const prevValue = isPlaying;
      setIsPlaying(!prevValue); //updates state
      if (!prevValue) {
        audioPlayer.current.play(); //if true, plays audio and update animation for progressBar
        // animationRef.current = requestAnimationFrame(whilePlaying)
      } else {
        audioPlayer.current.pause(); //if false, pauses audio and cancel animation for progressBar
        // cancelAnimationFrame(animationRef.current);
      }
    }
  };

  const changePlayerCurrentTime = () => {
    //updates style (width) of the left side of progressBar (before slider)
    progressBar.current.style.setProperty(
      "--seek-before-width",
      `${(progressBar.current.value / duration) * 100}%`
    );
    setCurrentTime(progressBar.current.value); //updates state
  };

  const whilePlaying = () => {
    progressBar.current.value = audioPlayer.current.currentTime; //updates the progressBar to match audio's current time
    changePlayerCurrentTime(); //updates style of progressBar
    animationRef.current = requestAnimationFrame(whilePlaying); //constantly updates animation
  };

  const changeRange = () => {
    //updates the audio's current to following progressBar when users seek own time
    audioPlayer.current.currentTime = progressBar.current.value;
    changePlayerCurrentTime(); //updates style of progressBar
  };

  useEffect(() => {
    audioPlayer.current.addEventListener("ended", () => {
      if (nowPlaying.index === nowPlaying?.array?.length - 1) {
        const newIndex = 0;
        const newNowPlaying = { ...nowPlaying };
        newNowPlaying.index = newIndex;
        setNowPlaying(newNowPlaying);
      } else {
        const newNowPlaying = { ...nowPlaying };
        newNowPlaying.index = newNowPlaying.index + 1;
        setNowPlaying(newNowPlaying);
      }
    });
    audioPlayer.current.addEventListener("playing", () => {
      animationRef.current = requestAnimationFrame(whilePlaying);
    });
    audioPlayer.current.addEventListener("pause", () => {
      cancelAnimationFrame(animationRef.current);
    });
    if (Object.keys(nowPlaying).length === 0) {
      audioPlayer.current.pause();
    }
  }, [nowPlaying]);

  const handleSkipEnd = () => {
    if (nowPlaying?.array?.length === 1) {
      audioPlayer.current.currentTime = 0;
    } else {
      audioPlayer.current.currentTime = audioPlayer.current.duration;
    }
    audioPlayer.current.loop = false;
    setIsLooped(false); //updates state
    changePlayerCurrentTime();
  };

  const handleSkipStart = () => {
    if (audioPlayer.current.currentTime > 3) {
      audioPlayer.current.currentTime = 0;
    } else {
      if (nowPlaying?.array?.length === 1) {
        audioPlayer.current.currentTime = 0;
      } else {
        let newIndex;
        if (nowPlaying.index === 0) {
          newIndex = nowPlaying.array.length - 1;
        } else {
          newIndex = nowPlaying.index - 1;
        }
        const newNowPlaying = { ...nowPlaying };
        newNowPlaying.index = newIndex;
        setNowPlaying(newNowPlaying);
      }
    }
    audioPlayer.current.loop = false;
    setIsLooped(false); //updates state
    changePlayerCurrentTime();
  };

  const handleRepeatCurrentTrack = () => {
    const prevValue = isLooped;
    if (!prevValue) {
      audioPlayer.current.loop = true;
    } else {
      audioPlayer.current.loop = false;
    }
    setIsLooped(!prevValue); //updates state
  };

  const handleShuffle = () => {
    //The Fisher-Yates algorith
    const prevValue = isShuffled;
    const newNowPlaying = nowPlaying;
    if (!prevValue) {
      const shuffledArray = [...newNowPlaying?.array];
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        //for each element in array
        const j = Math.floor(Math.random() * (i + 1)); //generate random number
        const temp = shuffledArray[i];
        shuffledArray[i] = shuffledArray[j]; //swap element in array with a random element in array
        shuffledArray[j] = temp; //swap
      }
      newNowPlaying.array = shuffledArray;
    } else {
      const originalArray = Object.values(
        library[nowPlaying?.playlistIndex]
      )[0];
      newNowPlaying.array = originalArray; //back to original array
    }
    setNowPlaying(newNowPlaying);
    setIsShuffled(!prevValue);
  };

  const changeRangeVolume = () => {
    //updates the audio's current volume to following volumeBar when users seek own volume
    audioPlayer.current.volume = volumeBar.current.value/100;
    changePlayerCurrentVolume(); //updates style of progressBar
  };

  const changePlayerCurrentVolume = () => {
    //updates style (width) of the left side of volumeBar (before slider)
    volumeBar.current.style.setProperty(
      "--seek-before-width",
      `${(volumeBar.current.value / 100) * 100}%`
    );
  };

  // {muted: false, prevVolume: 0}
  const handleMute = () => {
    const prevValue = isMuted.muted;
    const volDetails = { ...isMuted };
    if (!prevValue) {
      volDetails.prevVolume = audioPlayer.current.volume;
      audioPlayer.current.volume = 0;
      volumeBar.current.value = 0
    } else {
      audioPlayer.current.volume = volDetails.prevVolume;
      volumeBar.current.value = volDetails.prevVolume*100;
    }
    volDetails.muted = !prevValue;
    setIsMuted(volDetails); //updates state
  };

  return (
    <>
      <div id="welcomeDiv">
        <h1>WELCOME, {userDetails.username}!</h1>
        <button onClick={handleRemoveWelcomeDiv}>remove landing image</button>
      </div>

      <div id="header">
        <Link to="/user">
          <div>HOME</div>
        </Link>
        <Link to="/user/playlists">
          <div>PLAYLISTS</div>
        </Link>
        <Link to="/user/search">
          <div>SEARCH</div>
        </Link>
        <Link to="/user/stats">
          <div>STATS</div>
        </Link>

        <div id="dropdown">
          <p>img: user icon</p>
          <div>
            <Link to="/user/account">Account Info</Link>
            <Link to="/" onClick={() => (setNowPlaying([]))}>Logout</Link>
          </div>
        </div>
      </div>

      <Outlet />

      <div id="footer">
        {/* <img src="" alt="logo" />
        <h1>BRAND NAME</h1> */}

        <div id="nowPlaying">
          <audio
            ref={audioPlayer}
            src={nowPlaying?.array?.[nowPlaying.index]?.url}
            volume={0.5}
            autoPlay
            loop={nowPlaying?.array?.length === 1}
          />
          <p>
            {nowPlaying?.array?.[nowPlaying.index]?.title ||
              "No Track Selected"}
          </p>
          <p>{nowPlaying?.array?.[nowPlaying.index]?.artist}</p>
          {
            <img
              src={
                nowPlaying?.array?.[nowPlaying.index]?.image ||
                "default grey pic"
              }
              width="50px"
            />
          }

          <TbArrowsShuffle onClick={handleShuffle} />

          {/* 1) if currentime is more than 3 seconds, change currenttime to 0 (play song from start)
          2) else, if its first song in playlist, go to prev url. if first song, go to last song*/}
          <BsFillSkipStartFill onClick={handleSkipStart} />

          {isPlaying ? (
            <BsPauseFill onClick={togglePlayPause} />
          ) : (
            <BsPlayFill onClick={togglePlayPause} />
          )}

          {/* onclick: //currentime=max/duration// >>>> 1) if not last song in playlist, go to next url. if last song, go to first song*/}
          <BsFillSkipEndFill onClick={handleSkipEnd} />

          {/* onclick 1) toggle such that repeats/does not repeat current track. default repeat for playlists (even with one song inside)*/}
          <TbRepeatOnce onClick={handleRepeatCurrentTrack} />

          {/* current time */}
          <p>{calculateTime(currentTime) || "00:00"}</p>

          {/* progress bar */}
          <div>
            <input
              type="range"
              defaultValue="0"
              ref={progressBar}
              onChange={changeRange}
            />
          </div>

          {/* total duration */}
          <p>
            {(duration && !isNaN(duration) && calculateTime(duration)) ||
              "00:00"}
          </p>

          {/* onclick: 1) mute - audioPlayer.volume = 0 (0-1) 2) create progressbar, same concept*/}
          {isMuted.muted ? (
            <BsFillVolumeMuteFill onClick={handleMute} />
          ) : (
            <BsFillVolumeUpFill onClick={handleMute} />
          )}
          <input
            type="range"
            defaultValue="100"
            ref={volumeBar}
            onChange={changeRangeVolume}
          />

          {/* maximise/minimise */}
          <button onClick={handleNowPlayingSize}>
            {isMaximised ? "minimise" : "maximise"}
          </button>

          {isMaximised ? '' : <button onClick={handleScrollToTop}>scroll to top</button>}
        </div>
      </div>
    </>
  );
};

export default Layout;
