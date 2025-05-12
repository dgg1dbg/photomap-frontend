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
 
const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
      message: "Please enter a valid email.",
  }),
  password: z.string().min(4, {
    message: "Password must be at least 4 characters.",
  }),

  confirmPassword: z.string().min(4, {
    message: "Confirm password must be at least 4 characters.",
  })
}).refine((data) => data.password == data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
 
const Signup = () => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })
  
  const router = useRouter();

  const [failed, setFailed] = useState(false);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    axios({
      method: "POST",
      url: `/api/user/signup`,
      headers: {'Content-Type': 'application/json'},
      data: {
          username: data.username,
          email: data.email,
          password: data.password,
          desiption: "",
      },
      }).then((res) => {
        localStorage.setItem("token", res.data.token);
        router.push("/");
      }).catch(() => {
        setFailed(true);
      })
  }
 
  return (
    <>
    <div className="flex flex-col gap-3 p-10">
    <h1 className="text-4xl font-bold mt-10">Sign Up</h1>
    <h2 className="text-sm text-gray-500">Hello World!</h2>
    <Separator className="my-5"/>
    </div>
    <div className="flex justify-center p-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-[500px] bg-white rounded-lg shadow-md p-10 flex flex-col gap-3">
          <h1 className="text-2xl">Enter Your Info</h1>
          <h2 className="text-sm text-gray-500">Create an account to get started</h2>
          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="">
                <div className="flex flex-row items-center">
                  <FormLabel className="w-1/5">Username</FormLabel>
                  <FormControl className="w-4/5">
                    <Input className="text-sm" placeholder="" {...field} value = {field.value}/>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field - Now Separate! */}
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
                    <Input type = "password" placeholder="" {...field} value = {field.value} className="text-sm"/>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword" 
            render={({ field }) => (
              <FormItem className="">
                <div className="flex flex-row items-center">
                  <FormLabel className="w-1/5">Confirm</FormLabel>
                  <FormControl className="w-4/5">
                    <Input type = "password" placeholder="" {...field} value = {field.value} className="text-sm"/>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {failed && <h2 className="text-red-500">Failed to Sign Up. Duplicated Username or Email</h2>}
          <Button type="submit" className="w-1/3 self-center p-15px">SignUp</Button>
        </form>
        
      </Form>
      <Toaster />
      
    </div>
    </>
  )
}

export default Signup;