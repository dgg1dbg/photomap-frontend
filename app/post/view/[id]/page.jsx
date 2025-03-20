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

import { IoMdPricetag, IoIosLocate, IoMdMap, IoMdPerson, IoMdBrush } from "react-icons/io";

import config from "../../../../config.json";

import { useMapStore } from "@/store/useMapStore";

const Post = () => {
    const mapRef = useRef(null);
    const router = useRouter();
    const params = useParams();
    const [isOwner, setIsOwner] = useState(false);
    const [user, setUser] = useState(null);
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
    const [hashtags, setHashtags] = useState([]);
    
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
                Authentication: token,
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
            setUser(res.data.user);
            setHashtags(res.data.hashtag.split("#").filter((hashtag) => hashtag !== ""));
        }).catch(() => {
            router.push("/user/signin");
        })

        
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/user/signin");
        }
        if (user) {
            axios({
                method: "GET",
                url: `${config.backend_url}/api/user/view`,
                headers: {
                    'Content-Type': 'application/json',
                    Authentication: token,
                },
            }).then((res) => {
                setIsOwner(res.data.username === user.username);
            }).catch((err) => {
                console.log(err);
                router.push("/user/signin");
            })
        }
    }
    , [user]);

    const theme = useMapStore((state) => state.map);

    return (
        <> 
      <div className="fixed top-3 left-3 z-10 flex flex-col gap-2">
      <div className="border-gray-300 border rounded-full">
        <IoMdMap size={25} className="bg-black p-0.5 rounded-full" color="white" onClick={mapIcon}/>
      </div>
      </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-col gap-3 p-10 ">
                <h1 className="text-4xl font-bold mt-3">{postData.name}</h1>
                <div className="flex flex-row gap-3 items-center">
                    <h1 className="text-sm text-gray-500"><IoMdPerson/></h1>
                    <Label onClick={() => router.push(`/user/view/${user?.username}`)}>
                        <h1 className="text-sm text-black-500">{user?.username}
                        </h1>
                    </Label>
                </div>
                <h1 className="text-md text-black-500">{postData.description}</h1>
                <div className="flex flex-row gap-3 items-center">
                    <h2 className="text-sm text-gray-500"><IoMdPricetag/></h2>
                    {hashtags.map((hashtag, index) => (
                        <Label key={index} className="bg-gray-200 rounded-full px-2 relative group" onClick={() => router.push(`/tag/picture/${hashtag}`)}>
                            {hashtag}
                        </Label>
                    ))}
                </div>
                </div>
                <div className="flex flex-col justify-center p-10">
                    {
                        isOwner &&
                        <Button onClick={() => {router.push(`/post/edit/${params.id}`)}}><IoMdBrush/></Button>
                    }
                </div>
            </div>
            <Separator className="my-5"/>
            <div className="flex justify-center mt-20">
                <Carousel className="bg-white p-10 flex flex-col gap-3 w-[800px]">
                    <CarouselContent>
                    {imageStructList.map((imageStruct, index) => (
                        <CarouselItem key={index} className="flex justify-center items-center">
                            <div className="flex flex-col gap-3">
                            <Card className="rounded-none">
                                <CardContent className="flex justify-center align-center p-1">
                                    {imageStruct.file ? 
                                        <img src={`${config.backend_url}/api/picture?dir=${encodeURIComponent(imageStruct.file)}`}/>: 
                                        <h1 className="text-4xl w-[700px] h-[700px] flex justify-center items-center">?</h1>
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
                                        initialViewState={{
                                            longitude: imageStruct.coordinates.longitude,
                                            latitude: imageStruct.coordinates.latitude,
                                            zoom: 8,
                                            pitch: 30,
                                        }}
                                        style={{ width: "100%", height: "100%" }}
                                        mapStyle={`/${theme}.json`}
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
                            </div>
                            <div className="text-sm text-gray-500">
                                {imageStruct.description}
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
            </div>
        </>
    )
}

export default Post;
