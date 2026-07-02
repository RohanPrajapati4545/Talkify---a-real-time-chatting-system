import React from 'react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'

const Layout = ({children}) => {
  return (
   <>
     <div className="d-flex flex-column min-vh-100">

      <Header />
      <div >
  {children}
</div>

      <div className="flex-grow-1">
       
      </div>

      <Footer />

    </div>
   </>
  )
}

export default Layout