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
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import ExifReader from "exifreader"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"

import { debounce } from "lodash";

import { IoMdPricetag, IoIosLocate, IoMdMap, IoIosRemoveCircleOutline, IoMdSave } from "react-icons/io";

import config from "../../../../config.json";

import { useMapStore } from "@/store/useMapStore"

const EditPost = () => {
    const mapRef = useRef(null);
    const router = useRouter();
    const params = useParams();
    const [imageStructList, setImageStructList] = useState([
        {file: null, description: "", coordinates : {latitude: 0, longitude: 0}},
    ]);
    const [postData, setPostData] = useState({
        name: "",
        hashtag: "",
        date: "2025-01-01",
        time: "12:00:00",
        description: "",
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
            url: `${config.backend_url}/api/hashtag/create/${hashtagInput}`,
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
            url: `${config.backend_url}/api/hashtag/search/${value}`,
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

    const handleChange = (event) => {
        const {name, value} = event.target;
        setPostData((prevData) => ({
            ...prevData,
            [name]: value,

        }));
    }

    const handleImageDescriptionChange = (event, index) => {
        const {value} = event.target;
        setImageStructList((prevList) => {
            const newList = [...prevList];
            newList[index].description = value;
            return newList;
        });
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

        setImageStructList((prevList) => {
            const newList = [...prevList];
            newList[newList.length - 1].file = file;
            newList[newList.length - 1].coordinates = { 
                latitude: latitude || 0, 
                longitude: longitude || 0 
            };
            newList.push({ file: null, description: "", coordinates: { latitude: 0, longitude: 0 } });
            return newList;
        })
    }

    const handleSubmit = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/user/signin");
        }
        const formData = new FormData();
        formData.append("name", postData.name);
        formData.append("description", postData.description);
        formData.append("hashtag", makeHashtagText());
        formData.append("date", postData.date);
        formData.append("time", postData.time);

        for (let i = 0; i < imageStructList.length - 1; i++) {
            const imageStruct = imageStructList[i];
            if (typeof imageStruct.file === "string"){
                formData.append("paths", imageStruct.file);
            } else {
                formData.append("files", imageStruct.file);
            }
            formData.append("descriptions", imageStruct.description || "");
            formData.append("coordinates", imageStruct.coordinates ?  JSON.stringify([imageStruct.coordinates.longitude, imageStruct.coordinates.latitude]): []);
        }

        axios({
            method: "PUT",
            url: `${config.backend_url}/api/post/edit/${params.id}`,
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

  const mapIcon = () => {
    router.push("/");
  };



    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/user/signin");
        }
        axios({
            method: "GET",
            url: `${config.backend_url}/api/post/view/${params.id}`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
        }).then((res) => {
            setPostData({
                name: res.data.name,
                description: res.data.description,
                hashtag: res.data.hashtag,
                date: res.data.date,
                time: res.data.time,
            });
            setImageStructList(res.data.pictures.map((image) => ({
                file: image.fileDir,
                description: image.description,
                coordinates: {
                    latitude: image.latitude,
                    longitude: image.longitude,
                },
            })));
            setImageStructList((prevList) => {
                return [
                    ...prevList,
                    {file: null, description: "", coordinates : {latitude: 0, longitude: 0}},
                ];
            }
            );
            setHashtags(res.data.hashtag.split("#").filter((hashtag) => hashtag !== ""));
        }).catch(() => {
            router.push("/user/signin");
        })
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
                    className="text-md text-black-500 border-none outline-none focus:ring-0 bg-transparent px-0 py-1 resize-none"
                />
                <div className="flex flex-row gap-3 items-center">
                    <h2 className="text-sm text-gray-500"><IoMdPricetag/></h2>
                    {hashtags.map((hashtag, index) => (
                        <Label key={index} className="bg-gray-200 rounded-full px-2 relative group">
                            {hashtag}
                            <span 
                                className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs cursor-pointer group-hover:cursor-pointer"
                                onClick={() => removeHashtag(index)}
                            >
                                x
                            </span>
                        </Label>
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
            <div className="flex justify-center">
                <Carousel className="w-[800px] bg-white p-10 flex flex-col gap-3">
                    <CarouselContent>
                    {imageStructList.map((imageStruct, index) => (
                        <CarouselItem key={index} className="flex justify-center items-center">
                            <div className="flex flex-col gap-3">
                            <Card className="rounded-none">
                                <CardContent className="flex justify-center align-center p-2">
                                    {imageStruct.file ? 
                                        <img 
                                            src={imageStruct.file instanceof File 
                                                ? URL.createObjectURL(imageStruct.file) 
                                                : `${config.backend_url}/api/picture?dir=${encodeURIComponent(imageStruct.file)}`} 
                                            onError={(e) => {
                                                if (imageStruct.file instanceof File) return; // Avoid infinite loop
                                                e.target.src = URL.createObjectURL(imageStruct.file);
                                            }}
                                            alt="Uploaded Image"
                                        /> :
                                        <Label htmlFor= "fileInput" className="text-4xl"><h1 className="text-4xl w-[700px] h-[700px] flex justify-center items-center">+</h1></Label>
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
                                        initialViewState={
                                            imageStruct.coordinates.latitude && imageStruct.coordinates.longitude ?
                                            {
                                                longitude: imageStruct.coordinates.longitude,
                                                latitude: imageStruct.coordinates.latitude,
                                                zoom: 12,
                                                pitch: 30,
                                            } :
                                            viewState
                                        }
                                        style={{ width: "100%", height: "100%" }}
                                        mapStyle={`/${theme}.json`}
                                        onClick={(event) => handleMapClick(event, index)}
                                    >
                                    {imageStructList.map((imageStruct, i) => (
                                        imageStruct.coordinates.latitude && imageStruct.coordinates.longitude ?
                                        (
                                        <Marker
                                            key={i}
                                            longitude={imageStruct.coordinates.longitude}
                                            latitude={imageStruct.coordinates.latitude}
                                        >
                                        {index == i ? 
                                            <div className="bg-red-500 w-4 h-4 rounded-full"></div> :
                                            <div className="bg-blue-500 w-4 h-4 rounded-full"></div>
                                        }
                                        </Marker>
                                        ) : null
                                    )) }
                                    </Map>
                                </PopoverContent>
                            </Popover>
                            <Button onClick={removeImage}><IoIosRemoveCircleOutline/></Button>
                            </div>
                            <textarea
                             placeholder="Descriptions"
                             name="description"
                             value={imageStruct.description}
                             onChange={(event) => handleImageDescriptionChange(event, index)}
                             className="text-sm text-gray-500 border-none outline-none focus:ring-0 bg-transparent px-0 py-1 resize-none"
                            />
                            </>
                            }
                            
                            
                            </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </>
    )
}

export default EditPost;
