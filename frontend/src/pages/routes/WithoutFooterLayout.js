import React from 'react'
import Header from '../components/Header'

const WithoutFooterLayout = ({children}) => {
  return (
  <>
  <Header />
  {children}
  </>
  )
}

export default WithoutFooterLayout