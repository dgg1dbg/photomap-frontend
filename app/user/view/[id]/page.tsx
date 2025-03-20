"use client"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
  } from "@/components/ui/sheet"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label";
import {IoMdMap} from "react-icons/io";

import config from "../../../../config.json";

export default function UserProfile() {
    const params = useParams();
    const userName = params.id;
    const [user, setUser] = useState({
        username: "",
        email: "",
        description: "",
        posts: [],
    });

    const router = useRouter();
    const [isOwner, setIsOwner] = useState(false);

    const [editProfile, setEditProfile] = useState({
        username: "",
        description: "",
    });

    const handleRowClick = (postID: number) => {
        router.push(`/post/view/${postID}`)
    }

    const handleChange = (e) => {
        setEditProfile({
            ...editProfile,
            [e.target.id]: e.target.value,
        });
    }
    const mapIcon = () => {
        router.push("/");
    };

    const handleSubmit = () => {
        const token = localStorage.getItem("token");
        axios({
            method: "PUT",
            url: `${config.backend_url}/api/user/edit`,
            headers: {
                'Content-Type': 'application/json',
                Authentication: token,
            },
            data: {
                username: editProfile.username || null,
                password: null,
                description: editProfile.description || null,
            },
        }).then(() => {
            router.push(`/user/view/${editProfile.username}`);
        }).catch((err) => {
            console.log(err);
        });
    }
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/user/signin");
        }

        axios({
            method: "GET",
            url: `${config.backend_url}/api/user/view`,
            headers: {
                'Content-Type': 'application/json',
                Authentication: token,
            },
        }).then(() => {
        }).catch(() => {
            router.push("/user/signin");
        });

        axios({
            method: "GET",
            url: `${config.backend_url}/api/user/view/${userName}`,
            headers: {
                'Content-Type': 'application/json',
                Authentication: token,
            },
        }).then((res) => {
            setUser({
                username: res.data.username,
                email: res.data.email,
                description: res.data.description,
                posts: res.data.posts,
            });
            setEditProfile({
                username: res.data.username,
                description: res.data.description,
            });
        }).catch((err) => {
            console.log(err);
        });
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
    }, [user]);


    return (
        <>
        <div className="fixed top-3 left-3 z-10 flex flex-col gap-2">
        <div className="border-gray-300 border rounded-full">
          <IoMdMap size={25} className="bg-black p-0.5 rounded-full" color="white" onClick={mapIcon}/>
        </div>
        </div>
        <div className="flex items-center justify-center h-screen">
          <Card className="w-[500px] h-[500px] flex flex-col">
            <CardHeader>
              <div className="flex flex-row ">
                <CardTitle className="ml-3 mt-3">{user.username}</CardTitle>
                {
                    isOwner ? (
                        <Sheet>
                            <SheetTrigger>Edit</SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                <SheetTitle>Edit profile</SheetTitle>
                                <SheetDescription>
                                    Make changes to your profile here. Click save when you`&apos`re done.
                                </SheetDescription>
                                </SheetHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="username" className="text-right">
                                        Username
                                        </Label>
                                        <Input id="username" value={editProfile.username} className="col-span-3" onChange={handleChange} />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="description" className="text-right">
                                        Description
                                        </Label>
                                        <Input id="description" value={editProfile.description} className="col-span-3" onChange={handleChange} />
                                    </div>
                                </div>
                                <SheetFooter>
                                    <Button type="submit" onClick={handleSubmit}>Save changes</Button>
                                </SheetFooter>
                            </SheetContent>
                            </Sheet>
                    ) : null
                }
              </div>
              
              <CardDescription>{user.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <Table>
                <TableCaption>A list of recent Posts.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Title</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.posts.map((post, index) => (
                    <TableRow key={index} onClick={() => handleRowClick(post.id)}>
                      <TableCell className="font-medium">{post.name}</TableCell>
                      <TableCell className="text-right">{post.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>  
            <CardFooter></CardFooter>
          </Card>
        </div>
        </>
      );
      
}
