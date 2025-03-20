"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
 
import axios from "axios"
import { Button } from "@/components/ui/button"
import {Separator} from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Toaster } from "@/components/ui/toaster"
import {useRouter} from "next/navigation"
import { Label } from "@radix-ui/react-label"
 
const FormSchema = z.object({
  email: z.string().email({
      message: "Please enter a valid email.",
  }),
  password: z.string().min(4, {
    message: "Password must be at least 4 characters.",
  }),
})

import config from "../../../config.json";
 
const Signin = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const router = useRouter();

  const [failed, setFailed] = useState(false);
 
  function onSubmit(data: z.infer<typeof FormSchema>) {
    axios({
      method: "POST",
      url: `${config.backend_url}/api/user/signin`,
      headers: {'Content-Type': 'application/json'},
      data: {
          email: data.email,
          password: data.password,
      },
      }).then((res) => {
        localStorage.setItem("token", res.headers.authentication);
        router.push("/");
      }).catch(() => {
        setFailed(true);
      })
  }
 
  return (
    <>
    <div className="flex flex-col gap-3 p-10">
    <h1 className="text-4xl font-bold mt-10">Sign In</h1>
    <h2 className="text-sm text-gray-500">Welcome Back!</h2>
    <Separator className="my-5"/>
    </div>
    <div className="flex justify-center p-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-[500px] bg-white rounded-lg shadow-md p-10 flex flex-col gap-3">
          <FormField
            control={form.control}
            name="email" 
            render={({ field }) => (
              <FormItem className="">
                <div className="flex flex-row items-center">
                  <FormLabel className="w-1/5">Email</FormLabel>
                  <FormControl className="w-4/5">
                    <Input placeholder="" {...field} value = {field.value} className="text-sm"/>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password" 
            render={({ field }) => (
              <FormItem className="">
                <div className="flex flex-row items-center">
                  <FormLabel className="w-1/5">Password</FormLabel>
                  <FormControl className="w-4/5">
                    <Input type = "password" placeholder="" {...field} value = {field.value ?? ""} className="text-sm"/>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {failed && <h2 className="text-red-500">Failed to Sign In. Incorrect Email or Password</h2>}
          <Button type="submit" className="w-1/3 self-center p-15px mt-[10px]">SignIn</Button>
          <div className="flex flex-row justify-center gap-3">
          <h2 >Dont have Account?</h2> <Label className="self-center cursor-pointer" onClick={() => router.push("/user/signup")}>SignUp</Label>
          </div>
        </form>
        
      </Form>
      <Toaster />
      
    </div>
    </>
  )
}

export default Signin;