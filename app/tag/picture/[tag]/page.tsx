"use client"
import React, { useEffect, useState, useRef, useMemo, use } from "react";
import { Map, Marker, MapProvider } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import axios from "axios";
import { useRouter } from "next/navigation";
import { IoMdMap, IoMdPerson, IoIosMoon, IoIosSunny } from "react-icons/io";
import { useMapStore } from "@/store/useMapStore";
import config from "../../../../config.json";
import { useParams } from "next/navigation";

const TagPicture = () => {
  const mapRef = useRef(null);
  const [isClient, setIsClient] = useState(false);
  const [imageStructList, setImageStructList] = useState([
    { file: null, description: "", coordinates: { latitude: 0, longitude: 0 }, postId: null }
  ]);

  const router = useRouter();
  const handleMapClick = () => {
    router.push("/post/create");
  }

  const mapIcon = () => {
    router.push("/");
  };

  const tag = useParams().tag;


const userIcon = async () => {
  let userName = "";
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/user/signin");
    return; // Exit early if there's no token
  }

  try {
    const res = await axios({
      method: "GET",
      url: `${config.backend_url}/api/user/view`,
      headers: {
        'Content-Type': 'application/json',
        Authentication: token,
      },
    });

    userName = res.data.username;
    console.log(userName);  // Log userName after it's fetched
    router.push(`/user/view/${userName}`);  // Redirect to the user's page
  } catch (err) {
    console.error("Error fetching user:", err);
    router.push("/user/signin");  // Redirect to sign-in on error
  }
}

const themeIcon = () => {
  const map = useMapStore.getState().map;

  if (map === "positron") {
    useMapStore.setState({ map: "dark_matter" });
  } else {
    useMapStore.setState({ map: "positron" });
  }
}

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        router.push("/user/signin");
    }

    axios({
      method: "GET",
      url: `${config.backend_url}/api/hashtag/picture/${tag}`,
      headers: {
        'Content-Type': 'application/json',
        Authentication: token,
     },
    }).then((res) => {
      setImageStructList(res.data.pictures.map((image) => ({
        file: image.fileDir,
        description: image.description,
        coordinates: {
          latitude: image.latitude,
          longitude: image.longitude,
        },
        postId: image.postId,
      })));
    }).catch((err) => {
      console.log(err);
    })
  }, []);
  const theme = useMapStore((state) => state.map);

  if (!isClient) return <div className="">Loading...</div>;

  

  return (
    <>
      <div className="fixed top-3 left-3 z-10 flex flex-col gap-2">
      <div className="border-gray-300 border rounded-full">
        <IoMdMap size={25} className="bg-black p-0.5 rounded-full" color="white" onClick={mapIcon}/>
      </div>
      <div className="border-gray-300 border rounded-full">
        <IoMdPerson size={25} className="bg-black p-0.5 rounded-full" color="white" onClick = {userIcon}/>
      </div>
      </div>

      <div className="fixed top-3 right-3 z-10 flex flex-col gap-2">
        <div className="border-gray-300 border rounded-full">
          {theme === "positron" ? (
            <IoIosMoon size={25} className="bg-black p-0.5 rounded-full" color="white" onClick={themeIcon}/>
          ) : (
            <IoIosSunny size={25} className="bg-black p-0.5 rounded-full" color="white" onClick={themeIcon}/>
          )}
        </div>
      </div>

    <MapProvider>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 127.766922,
            latitude: 35.907757,
            zoom: 6,
            pitch: 30
          }}
          style={{ width: "100%", height: "100vh" }}
          mapStyle={`/${theme}.json`}
          onClick={handleMapClick}
        >
          {imageStructList.map((imageStruct, index) => (
            imageStruct.coordinates.latitude && imageStruct.coordinates.longitude ? (
              <ImageMarker key={index} k={index} imageStruct={imageStruct} />
            ) : null
          ))}
        </Map>
      </div>
    </MapProvider>
    </>
  );
}

const ImageMarker = ({ k, imageStruct }) => {
  const router = useRouter();
  const handleImageClick = (postId, event) => {
    event.stopPropagation(); // Prevents click from reaching the map
    router.push(`/post/view/${postId}`);
  }

  return (
    <Marker
      key={k}
      longitude={imageStruct.coordinates.longitude}
      latitude={imageStruct.coordinates.latitude}
    >
      <div className="relative group">
      <div className="bg-red-500 w-2 h-2 rounded-full cursor-pointer group-hover:hidden" />
      
      {/* Image Preview Container */}
      <div className=" hidden group-hover:block">
        {/* Image with loading state */}
        <div className="w-[300] h-[300]">
          <img 
            src={imageStruct.file ? `${config.backend_url}/api/picture?dir=${encodeURIComponent(imageStruct.file)}` : ""}
            alt="Location preview" 
            className=""
            loading="lazy"
            onClick={(e) => handleImageClick(imageStruct.postId, e)}
          />
        </div>
      </div>
    </div>
    </Marker>
  );
}

export default TagPicture;
