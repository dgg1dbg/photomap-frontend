"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {Separator} from "@/components/ui/separator"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"

import { Map, Marker } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import ExifReader from 'exifreader';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"

import { debounce, set } from "lodash";

import { IoMdPricetag, IoIosLocate, IoIosRemoveCircleOutline, IoMdSave, IoMdMap } from "react-icons/io";

import {useMapStore} from "@/store/useMapStore";

import imageCompression from 'browser-image-compression';

const CreatePost = () => {
    const mapRef = useRef(null);
    const router = useRouter();
    const [imageStructList, setImageStructList] = useState([
        {file: null, description: "", coordinates : {latitude: 0, longitude: 0}},
    ]);
    const [postData, setPostData] = useState({
        name: "",
        hashtag: "",
        date: "2025-01-01",
        time: "12:00:00",
        description: "",
        location: "",
    });
    const [viewState, setViewState] = useState({
        longitude: 127.766922,
        latitude: 35.907757,
        zoom: 6,
        pitch: 30,
    });
    const [hashtags, setHashtags] = useState([]);
    const [searchedHashtags, setSearchedHashtags] = useState([]);
    const [hashtagInput, setHashtagInput] = useState("");
    const [hashtagPopupOpen, setHashtagPopupOpen] = useState(false);

    const [locationPopupOpen, setLocationPopupOpen] = useState(false);
    const [locationInput, setLocationInput] = useState("");
    const [searchedLocations, setSearchedLocations] = useState([]);

    const handleHashtagChange = (event) => {
        const {value} = event.target;
        setHashtagInput(value);
        searchHashtags(value);
    }

    const addHashtag = (value) => {
        setHashtags((prevHashtags) => {
            const newHashtags = [...prevHashtags];
            newHashtags.push(value);
            return newHashtags;
        });
        setHashtagPopupOpen(false);
    }

    const removeHashtag = (index) => {
        setHashtags((prevHashtags) => {
            const newHashtags = [...prevHashtags];
            newHashtags.splice(index, 1);
            return newHashtags;
        });
    }

    const makeHashtagText = () => {
        let result = "";
        for (let i = 0; i < hashtags.length; i++) {
            result += "#";
            result += hashtags[i];
        }
        return result;
    }

    const createHashtag = () => {
        const token = localStorage.getItem("token");
        axios({
            method: "PUT",
            url: `/api/hashtag/create/${hashtagInput}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
        }).then((res) => {
            if (res.data.success) {
                setHashtags((prevHashtags) => {
                    const newHashtags = [...prevHashtags];
                    newHashtags.push(hashtagInput);
                    return newHashtags;
                });
                setHashtagPopupOpen(false);
            }
        }).catch((err) => {
            console.log(err);
        }
        )
    } 

    const searchHashtags = debounce((value) => {
        const token = localStorage.getItem("token");
        if (!value.trim()) {
            setSearchedHashtags([]);
            return;
        }
        axios({
            method: "GET",
            url: `/api/hashtag/search/${value}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
        }).then((res) => {
            setSearchedHashtags(res.data.hashtags.map((hashtag) => hashtag.name));
        }).catch((err) => {
            console.log(err);
        })
    }, 300);


    const handleLocationChange = (event) => {
        const {value} = event.target;
        setLocationInput(value);
    }

    const searchLocations = debounce((value) => {
        const token = localStorage.getItem("token");
        if (!value.trim()) {
            setSearchedLocations([]);
            return;
        }
        axios({
            method: "GET",
            url: "/api/place/search",
            params: {
                query: value,
            },
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
        }).then((res) => {
            setSearchedLocations(res.data.map((location) => ({
                name: location.name,
                coordinates: {
                    latitude: location.geometry.location.lat,
                    longitude: location.geometry.location.lng,
                },
                address: location.formatted_address,
            })));
        })
    }, 300);

    const createLocation = () => {
        return;
    }

    

    const uploadImage = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const tags = await ExifReader.load(file, {expanded: true});
        const latitude = tags?.gps?.Latitude; // Decimal format
        const longitude = tags?.gps?.Longitude; // Decimal format

        if (latitude && longitude){
            setViewState({
                longitude: longitude,
                latitude: latitude,
                zoom: 12, 
                pitch: 30,
            });
        }

        // Convert to signed decimal format
        setImageStructList((prevList) => {
            const newList = [...prevList];
            newList[newList.length - 1].file = file;
            newList[newList.length - 1].coordinates = { 
                latitude: latitude || viewState.latitude, 
                longitude: longitude || viewState.longitude 
            };
            newList.push({ file: null, description: "", coordinates: { latitude: 0, longitude: 0 } });
            return newList;
        })
    }

    const removeImage = (index) => {
        setImageStructList((prevList) => {
            const newList = [...prevList];
            newList.splice(index, 1);
            return newList;
        })
        if (imageStructList.length == 2) {
            setViewState({
                longitude: 127.766922,
                latitude: 35.907757,
                zoom: 6,
                pitch: 30,
            });
        }
    }

    const handleChange = (event) => {
        const {name, value} = event.target;
        setPostData((prevData) => ({
            ...prevData,
            [name]: value,

        }));
    }


    const handleMapClick = (event, index) => {
        const clickedCoordinates = event.lngLat;

        setImageStructList((prevList) => {
            const newList = [...prevList];
            newList[index].coordinates = {
                latitude: clickedCoordinates.lat,
                longitude: clickedCoordinates.lng,
            };
            return newList;
        });
        setViewState({
            longitude: clickedCoordinates.lng,
            latitude: clickedCoordinates.lat,
            zoom: 12,
            pitch: 30,
        });
    };

    const handleImageDescriptionChange = (event, index) => {
        const {name, value} = event.target;
        setImageStructList((prevList) => {
            const newList = [...prevList];
            newList[index].description = value;
            return newList;
        });
    }

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/user/signin");
        }
        const formData = new FormData();
        if (postData.name === "") {
            alert("Please enter a title.");
            return;
        }
        if (postData.description === "") {
            alert("Please enter a description.");
            return;
        }
        if (postData.location === "") {
            alert("Please enter a location.");
            return;
        }
        if (imageStructList.length === 1) {
            alert("Please upload at least one image.");
            return;
        }
        formData.append("name", postData.name);
        formData.append("description", postData.description);
        formData.append("hashtag", makeHashtagText());
        const now = new Date();
        formData.append("date", now.toISOString().split('T')[0]);
        formData.append("time", now.toISOString().split('T')[1].slice(0, 5));
        formData.append("place", postData.location);

        for (let i = 0; i < imageStructList.length - 1; i++) {
            const imageStruct = imageStructList[i];
            let file = imageStruct.file;

            if (file.size > 1024 * 1024) {
                try {
                    file = await imageCompression(file, {
                        maxSizeMB: 1,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    });
                } catch (error) {
                    console.error("Image compression failed:", error);
                    continue;
                }
            }
            formData.append("files", file);
            formData.append("descriptions", imageStruct.description || "");
            formData.append("coordinates", imageStruct.coordinates ?  JSON.stringify([imageStruct.coordinates.longitude, imageStruct.coordinates.latitude]): []);
        }

        axios({
            method: "POST",
            url: `/api/post/create`,
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: token,
            },
            data: formData,
        }).then((res) => {
            router.push(`/post/view/${res.data.id}`);
        }).catch((err) => {
            console.log(err);
        })

    }
    
    const mapIcon = () => {
      router.push("/");
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/user/signin");
        }
        axios({
            method: "GET",
            url: `/api/user/view`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
        }).then((res) => {
        }).catch((err) => {
            router.push("/user/signin");
        });
    }, []);

    const theme = useMapStore((state) => state.map);

    
    return (
        <>
        <div className="fixed top-3 left-3 z-10 flex flex-col gap-2">
          <div className="border-gray-300 border rounded-full">
            <IoMdMap size={25} className="bg-black p-0.5 rounded-full" color="white" onClick={mapIcon}/>
          </div>
        </div>

            <input id="fileInput" type="file" onChange={uploadImage} className="hidden" />
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-3 p-10 ">
                <input placeholder="Title"
                    name="name"
                    value = {postData.name}
                    onChange={handleChange}
                    className="text-4xl font-bold mt-3 border-none outline-none focus:ring-0 bg-transparent px-0 py-1" />
                <textarea 
                    placeholder="Descriptions"
                    name="description"
                    value={postData.description}
                    onChange={handleChange}
                    className="text-sm text-gray-500 border-none outline-none focus:ring-0 bg-transparent px-0 py-1 resize-none"
                />
                <div className="flex flex-row gap-3 items-center">
                    <h2 className="text-sm text-gray-500"><IoIosLocate/></h2>
                    <Popover open={locationPopupOpen} onOpenChange={setLocationPopupOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="outline"
                            role="combobox"
                            className="w-[5] h-[20] rounded-full text-sm flex items-center justify-center"
                            >
                            {postData.location || "+"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px]" side="bottom" align="start">
                            <div className="flex flex-col gap-2 w-full">
                            <div className="flex flex-row gap-3 items-center w-full">
                                <input
                                type="text"
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                placeholder="Search Location..."
                                className="flex-grow border px-3 py-2 rounded text-sm"
                                />
                                <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => searchLocations(locationInput)}
                                >
                                Search
                                </Button>
                            </div>
                            {searchedLocations.length === 0 ? (
                                <Label
                                onClick={createLocation}
                                className="text-sm text-muted-foreground cursor-pointer hover:underline"
                                >
                                No Existing Location Found. Click here to Create.
                                </Label>
                            ) : (
                                <div className="flex flex-col mt-2">
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Searched Locations</h4>
                                <ul className="space-y-1">
                                    {searchedLocations.map((location, index) => (
                                    <li
                                        key={index}
                                        onClick={() => {
                                        setLocationInput("");
                                        setPostData((prevData) => ({
                                            ...prevData,
                                            location: location.name,
                                        }));
                                        setViewState({
                                            longitude: location.coordinates.longitude,
                                            latitude: location.coordinates.latitude,
                                            zoom: 12,
                                            pitch: 30,
                                        });
                                        setLocationPopupOpen(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                                    >
                                        <div className="flex flex-col items-start">
                                        <span className="text-sm text-gray-500">{location.name}</span>
                                        <span className="text-xs text-gray-400">{location.address}</span>
                                        </div>
                                    </li>
                                    ))}
                                </ul>
                                </div>
                            )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="flex flex-row gap-3 items-center">
                    <h2 className="text-sm text-gray-500"><IoMdPricetag/></h2>
                    {hashtags.map((hashtag, index) => (
                        <Button key={index} variant="outline" className="w-[5] h-[20] rounded-full text-sm flex items-center justify-center relative">
                            {hashtag}
                            <span 
                                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs cursor-pointer group-hover:cursor-pointer"
                                onClick={() => removeHashtag(index)}
                            >
                                x
                            </span>
                        </Button>
                    ))}
                    <Popover open={hashtagPopupOpen} onOpenChange={setHashtagPopupOpen}>
                        <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-[5] h-[20] rounded-full text-sm flex items-center justify-center">+</Button></PopoverTrigger>
                        <PopoverContent className="w-[200px]" side="bottom" align="start">
                            <Command>
                                <CommandInput placeholder="Add Tag..." onInput={handleHashtagChange}/>
                                <CommandEmpty><Label onClick={createHashtag}>No Existing Tag Found. Click Here to Create.</Label></CommandEmpty>
                                <CommandGroup title="Searched Tags">
                                    <CommandList>
                                        {searchedHashtags.map((hashtag, index) => (
                                            <CommandItem key={index}
                                                value={hashtag}
                                                onSelect={(currentValue) => {
                                                    setHashtagInput("");
                                                    addHashtag(currentValue);
                                                } }
                                                >{hashtag}</CommandItem>
                                        ))}
                                    </CommandList>
                                </CommandGroup>
                                

                            </Command>
                            
                        </PopoverContent>
                    </Popover>
                    
                </div>
                
                </div>
                <div className="flex flex-col justify-center p-10">
                    <Button onClick={handleSubmit}><IoMdSave/></Button>
                </div>
            </div>
            <Separator className="my-5"/>
            <div className="flex justify-center mt-20">
                {postData.location &&
                <Carousel className="bg-white p-10 flex flex-col gap-3 w-[800px]">
                    <CarouselContent>
                    {imageStructList.map((imageStruct, index) => (
                        <CarouselItem key={index} className="flex justify-center items-center">
                            <div className="flex flex-col gap-3">
                            <Card className="rounded-none">
                                <CardContent className="flex aspect-square items-center justify-center p-2">
                                    {imageStruct.file ? 
                                        <img src={URL.createObjectURL(imageStruct.file)} />: 
                                        <Label htmlFor="fileInput" className="cursor-pointer"><h1 className="text-4xl w-[700px] h-[700px] flex justify-center items-center">+</h1></Label>
                                        }
                                </CardContent>
                            </Card>
                            {imageStruct.file &&
                            <>
                            <div className="flex flex-row gap-3 self-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button><IoIosLocate/></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[500px] h-[800px]">
                                    <Map
                                        ref={mapRef}
                                        initialViewState={viewState}
                                        style={{ width: "100%", height: "100%" }}
                                        mapStyle={`/${theme}.json`}
                                        onClick={(event) => handleMapClick(event, index)}
                                    >
                                    {imageStructList.map((imageStruct, index) => (
                                        imageStruct.coordinates.latitude && imageStruct.coordinates.longitude ?
                                        (
                                        <Marker
                                            key={index}
                                            longitude={imageStruct.coordinates.longitude}
                                            latitude={imageStruct.coordinates.latitude}
                                        >
                                        <div className="bg-red-500 w-4 h-4 rounded-full"></div>
                                        </Marker>
                                        ) : null
                                    )) }
                                    </Map>
                                </PopoverContent>
                            </Popover>
                            <Button onClick={removeImage}><IoIosRemoveCircleOutline/></Button>
                            </div>
                            </>
                            }
                            
                            
                            </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
                } 
            </div>
        </>
    )
}

export default CreatePost;
