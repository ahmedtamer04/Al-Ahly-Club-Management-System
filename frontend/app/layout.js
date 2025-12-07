import './utilities.css'

export const metadata = {
  title: 'Al-Ahly Events - University Event Management',
  description: 'Discover and register for university events, workshops, conferences, and more',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
