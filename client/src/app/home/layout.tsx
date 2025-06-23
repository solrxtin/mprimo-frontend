"use client"

import Footer from '@/components/Home/Footer'
import Header from '@/components/Home/Header'
import React from 'react'


type HomepageProps = {
  children?: React.ReactNode;
};

const Homepage = ({ children }: HomepageProps) => {
  return (
    <div className=" font-roboto">
     <Header />
     {children}
     <Footer />
     </div>
  );
};

export default Homepage