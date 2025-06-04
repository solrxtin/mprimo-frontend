import React from 'react'
import Header from './Header'
import MarketplaceSection from './Hero'
import BestDeals from './BestDeals'
import ShopCategoriesComponent from './ByCategory'
import FeaturedProducts from './ComputerAccessories'
import ComputerAccessories from './ComputerAccessories'

const Homepage = () => {
  return (
    <div className=" font-roboto">
     <Header />
     <MarketplaceSection />
     <BestDeals />
     <ShopCategoriesComponent />
     <FeaturedProducts />
     <ComputerAccessories />
    </div>
 
  )
}

export default Homepage