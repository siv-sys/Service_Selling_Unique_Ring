import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './views/DashboardView'
import Shop from './views/CoupleShopView'
import Cart from './views/cardView'
import Purchase from './views/PurchaseView'
import MyRing from './views/MyRingView'        // For "My Ring" navbar link - shows user's owned ring
import RingInfo from './views/RingInformation'  // For "See More" in shop - shows product details
import ThankYou from './views/ThankYou'
import Profile from './views/CoupleProfileView'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Shop routes */}
        <Route path="/shop" element={<Shop />} />
        
        {/* Cart and Purchase */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/purchase" element={<Purchase />} />
        
        {/* Ring routes - DIFFERENT PAGES FOR DIFFERENT PURPOSES */}
        <Route path="/myring" element={<MyRing />} />           
        <Route path="/ring-view" element={<RingInfo />} />     
        <Route path="/ring/:id" element={<RingInfo />} />       
        
        {/* Other routes */}
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/profile" element={<Profile />} />
        

        
      </Routes>
      
    </BrowserRouter>
  
    
  
  )
}

export default App
