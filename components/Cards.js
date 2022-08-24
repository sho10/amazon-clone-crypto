import React, { useContext, useState } from 'react'
import Card from './Card'
import { AmazonContext } from '../context/AmazonContext'
const Cards = () => {
	const styles = {
		container: `h-full w-full flex flex-col ml-[20px] mt-[50px] pl-10 ml-10`,
		title: `text-xl font-bolder mb-[20px] mt-[30px] ml-[10px]`,
		cards: `flex items flex-wrap gap-[80px] mt-10`
	}
  const { assets } = useContext(AmazonContext)
  return (
    <div className={styles.container}>
      <div className={styles.title}><b>New Releases</b></div>
			<div className={styles.cards}>
        { assets.map(item => {
          let asset = item.attributes
				  return <Card key={item.id} item={item.attributes} />
        })}
			</div>
    </div>
  )
}

export default Cards