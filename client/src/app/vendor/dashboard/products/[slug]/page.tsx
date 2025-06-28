import React from 'react'
import ProductDetail from './(components)/ProductDetail'

type PageProps = {
    params: {
      slug: string;
    };
  };
  

const page = async ({ params }: PageProps) => {
    const {slug} = await params
  return (
    <div className="p-4 md:p-4 lg:p-10 h-full bg-gray-100">
        <ProductDetail slug={slug} />
    </div>
  )
}

export default page