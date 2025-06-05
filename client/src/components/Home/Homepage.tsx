import React from 'react'
import Header from './Header'
import MarketplaceSection from './Hero'
import BestDeals from './BestDeals'
import ShopCategoriesComponent from './ByCategory'
import ComputerAccessories from './ComputerAccessories'
import FeaturedProducts from './FeaturedProduct'
import CustomerReviews from './Review'
import Cta from './Cta'

const Homepage = () => {
  return (
    <div className=" font-roboto">
     <Header />
     <MarketplaceSection />
     <BestDeals />
     <ShopCategoriesComponent />
     <FeaturedProducts />
     <ComputerAccessories />
     <CustomerReviews />
     <Cta />
    </div>
 
  )
}

export default Homepage