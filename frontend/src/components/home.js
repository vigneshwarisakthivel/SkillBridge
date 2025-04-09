import React, { useState, useEffect } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Core Swiper styles
import 'swiper/css/navigation'; // Optional navigation styles
import 'swiper/css/pagination'; // Optional pagination styles
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import logo from "../assets/Image20250320122406.png";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Card,
  CardContent,
  Chip,
  Box,
  Grid,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { useNavigate } from "react-router-dom"; // Commented out to avoid error
import image1 from '../assets/1.jfif';
import image2 from '../assets/2.jfif';
import image3 from '../assets/3.jfif';
import image5 from '../assets/5.jfif';
import image6 from '../assets/6.jfif';
import image7 from '../assets/7.jfif';
import image9 from '../assets/9.jfif';
import image10 from '../assets/10.jfif';

const HomePage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [setPerformers] = useState([]);
  const [features, setFeatures] = useState([]);
  const navigate = useNavigate(); // Commented out to avoid error
  const [setTestimonials] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
   

    axios
      .get("http://localhost:8000/api/performers/")
      .then((response) => {
        setPerformers(response.data);
      })
      .catch((error) => {
        console.error("Error fetching spotlight performers:", error);
      });

    axios
      .get("http://localhost:8000/api/features/")
      .then((response) => {
        setFeatures(response.data);
      })
      .catch((error) => {
        console.error("Error fetching key features:", error);
      });
  }, []);

  useEffect(() => {
    axios.get("http://localhost:8000/api/testimonials/")
      .then(response => setTestimonials(response.data))
      .catch(error => console.error("Error fetching testimonials:", error));
  }, []);

  const testimonials = [
    { id: 1, name: 'John Doe', profile_picture_url: image7, message: 'This platform is amazing!' },
    { id: 2, name: 'Jane Smith', profile_picture_url: image3, message: 'I learned so much from the tests!' },
    { id: 3, name: 'Michael Johnson', profile_picture_url: image10, message: 'The courses here are well-structured and easy to follow.' },
    { id: 5, name: 'Emily Davis', profile_picture_url: image5, message: 'I love the interactive exercises and quizzes!' },
    { id: 6, name: 'Sophia Martinez', profile_picture_url: image1, message: 'A must-visit platform for anyone looking to upskill!' },
    { id: 7, name: 'James Andriya', profile_picture_url: image9, message: 'The best online learning experience I’ve had!' },
    { id: 9, name: 'William Brown', profile_picture_url: image6, message: 'Fantastic resources and easy-to-understand lessons.' },
    { id: 10, name: 'Isabella White',profile_picture_url: image1, message: 'Helped me improve my skills tremendously!' },
  ];

  const performers = [
    { id: 1, name: 'Alice Johnson', profile_picture_url: image1, achievement: 'Top Scorer in Mathematics' },
    { id: 2, name: 'Bob Smith', profile_picture_url: image2, achievement: 'Outstanding Performance in Science' },
    { id: 3, name: 'Charlie Brown', profile_picture_url: image3, achievement: 'Excellence in Literature' },
    { id: 5, name: 'Ethan Williams', profile_picture_url: image5, achievement: 'Champion in Coding Competitions' },
    { id: 6, name: 'Fiona Garcia', profile_picture_url: image6, achievement: 'Top Innovator in Robotics' },
    { id: 7, name: 'George Lee', profile_picture_url: image7, achievement: 'Best Research Paper in Physics' },
    { id: 9, name: 'Ian Thompson', profile_picture_url: image9, achievement: 'Top Speaker in Debate Championships' },
    { id: 10, name: 'Julia Martinez', profile_picture_url: image10, achievement: 'Gold Medalist in Sports' },
  ];

  const HeroSection = () => (
    <Box sx={{ backgroundColor: "#006699", padding: "42px 16px", textAlign: "center" }}>
      <Typography variant="h2" color="white">
        Welcome to SmartBridge Online Test Platform
      </Typography>
      <Typography variant="h4" color="white" sx={{ marginTop: "16px" }}>
        Explore a variety of tests across categories and track your progress!
      </Typography>
      <Button
        variant="contained"
        color="primary"
        sx={{
          marginTop: "35px",
          padding: "10px 20px",
          borderRadius: "30px",
          fontSize: "1rem",
          '&:hover': {
            backgroundColor: "#003366",
          },
        }}
        onClick={() => navigate('/register')} // Commented out to avoid error
      >
        Get Started
      </Button>
    </Box>
  );

 

  const SpotlightPerformers = () => {
    const [selectedPerformer, setSelectedPerformer] = useState(null);

    const handlePerformerClick = (performer) => {
      setSelectedPerformer(performer);
    };

    const handleClosePopup = () => {
      setSelectedPerformer(null);
    };

    return (
      <>
        <Card style={{ margin: "20px 0", padding: "16px", backgroundColor: "#f9f9f9" }}>
  <CardContent>
    <Typography variant="h4" component="div" gutterBottom>
      Spotlight Performers
    </Typography>
    <Swiper
      modules={[Autoplay, Pagination]}
      spaceBetween={10}
      slidesPerView={1.5}
      breakpoints={{
        640: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 2.5 },
      }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      style={{ marginTop: "20px" }}
    >
      {performers.map((performer, index) => (
        <SwiperSlide key={index}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white", // Set background color to white
              borderRadius: "12px",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
              padding: "12px", // Adjusted padding
              height: "180px", // Adjusted height to match Testimonials
              textAlign: "center",
              cursor: "pointer",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.05)" },
              width: "90%", // Reduce width to create space
              margin: "0 auto", // Center the box
            }}
            onClick={() => setSelectedPerformer(performer)}
          >
            <Avatar
              src={performer.profile_picture_url}
              alt={performer.name}
              sx={{ width: 60, height: 60, marginBottom: "8px" }} // Adjusted avatar size
            />
            <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
              {performer.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.8rem" }}>
              {performer.achievement}
            </Typography>
          </Box>
        </SwiperSlide>
      ))}
    </Swiper>
  </CardContent>
</Card>

{selectedPerformer && (
  <Box
    sx={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
    onClick={handleClosePopup}
  >
    <Box
      sx={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        textAlign: "center",
        width: "300px", // Adjusted width for the popup
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Avatar
        src={selectedPerformer.profile_picture_url}
        alt={selectedPerformer.name}
        sx={{ width: 80, height: 80, marginBottom: "16px" }}
      />
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {selectedPerformer.name}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {selectedPerformer.achievement}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleClosePopup}
        sx={{ marginTop: "16px" }}
      >
        Close
      </Button>
    </Box>
  </Box>
)}
</>
    );
  };

  const KeyFeatures = () => (
    <Box sx={{ backgroundColor: "#f9fcff", padding: "30px 16px" }}>
      <Typography
        variant="h4"
        sx={{ textAlign: "center", marginBottom: "20px", color: "#f9f9f" }}
      >
        🚀 Key Features
      </Typography>
     
      <Grid container spacing={3} justifyContent="center">
       
        {/* Feature 1: Wide Range of Online Tests */}
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", padding: "20px", backgroundColor: "#ffffff", borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}> Wide Range of Online Tests</Typography>
            <Typography variant="body1">Access various subjects and difficulty levels tailored to your learning goals.</Typography>
          </Box>
        </Grid>
 
        {/* Feature 2: Real-Time Performance Analytics */}
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", padding: "20px", backgroundColor: "#ffffff", borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}> Real-Time Performance Analytics</Typography>
            <Typography variant="body1">Get instant reports on test scores, accuracy, and time spent per question.</Typography>
          </Box>
        </Grid>
 
        {/* Feature 3: AI-Based Test Recommendations */}
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", padding: "20px", backgroundColor: "#ffffff", borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}> AI-Powered Test Recommendations</Typography>
            <Typography variant="body1">Personalized test suggestions based on your past performance and weak areas.</Typography>
          </Box>
        </Grid>
 
        {/* Feature 4: Secure Exam Environment */}
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", padding: "20px", backgroundColor: "#ffffff", borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}> Secure & Fair Testing</Typography>
            <Typography variant="body1">Anti-cheat measures, webcam proctoring, and automated fraud detection.</Typography>
          </Box>
        </Grid>
 
        {/* Feature 5: Instant Feedback & Explanations */}
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", padding: "20px", backgroundColor: "#ffffff", borderRadius: 2, boxShadow: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}> Instant Feedback & Explanations</Typography>
            <Typography variant="body1">Review correct answers and detailed explanations right after each test.</Typography>
          </Box>
        </Grid>
 
      </Grid>
    </Box>
  );
  const Benefits = () => (
    <Box sx={{ backgroundColor: "#e0f7fa", padding: "30px 16px" }}>
      <Typography variant="h4" sx={{ textAlign: "center", marginBottom: "20px" }}>
      ⭐ Why Choose Skill Bridge?
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", marginBottom: "20px" }}>
            <Typography variant="h6">📊 Comprehensive Tests</Typography>
            <Typography variant="body1">Explore various categories and levels to sharpen your skills.</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", marginBottom: "20px" }}>
            <Typography variant="h6">📉 Real-Time Performance Tracking</Typography>
            <Typography variant="body1">Monitor your progress with detailed test analytics.</Typography>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ textAlign: "center", marginBottom: "20px" }}>
            <Typography variant="h6">🖱️ User-Friendly Interface</Typography>
            <Typography variant="body1">Easy navigation to find tests and track performance.</Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const FAQ = () => (
    <Card sx={{ margin: "20px 0", borderRadius: 3, boxShadow: 1, backgroundColor: "#f9fcff", padding: 2 }}>
      <CardContent>
        {/* Title with Emoji */}
        <Typography
          variant="h4"
          component="div"
          gutterBottom
          sx={{ color: "#f9f9f", textAlign: "left" }}
        >
          ❓ Frequently Asked Questions (FAQ)
        </Typography>
 
        {/* FAQ Items - Accordion */}
        {faqData.map((item, index) => (
          <Accordion key={index} sx={{ backgroundColor: "#ffffff", marginBottom: 2 , boxShadow: 0}}>
            <AccordionSummary sx={{ fontWeight: "bold", color: "#333" }}>
              <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                💬 {item.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="textSecondary">📝 {item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </CardContent>
    </Card>
  );
 
  // FAQ Data Array
  const faqData = [
    { question: "How can I register on skill Bridge?", answer: "You can register by clicking on the 'Sign Up' button on the homepage." },
    { question: "How do I start a test?", answer: "Once logged in, you can browse the test list and start any test you like." },
    { question: "What happens if I don't complete a test?", answer: "Your progress will be saved, and you can continue the test from where you left off." }
  ];

  const Testimonials = () => (
    <Card style={{ margin: "20px 0", padding: "16px", backgroundColor: "#f9f9f9" }}>
      <CardContent>
        <Typography variant="h4" component="div" gutterBottom>
          Testimonials
        </Typography>
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={10}
          slidesPerView={1.5}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 2.5 },
          }}
          autoplay={{ delay: 3000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          style={{ marginTop: "20px" }}
        >
          {testimonials.map((testimonial, index) => (
            <SwiperSlide key={index}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "white", // Set background color to white
                  borderRadius: "12px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                  padding: "12px",
                  height: "180px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.05)" },
                  width: "90%", // Reduce width to create space
                  margin: "0 auto", // Center the box
                }}
              >
                <Avatar
                  src={testimonial.profile_picture_url}
                  alt={testimonial.name}
                  sx={{ width: 60, height: 60, marginBottom: "8px" }}
                />
                <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                  {testimonial.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ fontSize: "0.8rem" }}>
                  {testimonial.message}
                </Typography>
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </CardContent>
    </Card>
  );
  const CallToAction = () => {
    const navigate = useNavigate();
 
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "5vh",
          padding: "50px 20px",
          background: "linear-gradient(135deg, #e0f7fa, #b2ebf2)",
        }}
      >
        <Paper
          elevation={4}
          sx={{
            padding: { xs: "30px", md: "50px" },
            textAlign: "center",
            borderRadius: "16px",
            maxWidth: "1100px",
            minHeight: "2vh",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#003366",
              marginBottom: "16px",
              fontSize: { xs: "1.8rem", md: "2.2rem" },
            }}
          >
             Ready to Take the Test?
          </Typography>
 
          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              marginBottom: "30px",
              fontSize: { xs: "1rem", md: "1.2rem" },
              lineHeight: 1.6,
              color: "#333",
            }}
          >
            Join thousands of users who are improving their skills on{" "}
            <b style={{ color: "#0077b6" }}>Skill Bridge</b> today. Get access to
            high-quality tests, real-time analytics, and AI-powered
            recommendations.
          </Typography>
 
          {/* Additional Benefits Section */}
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#0077b6", marginBottom: "8px" }}
              >
                 Real-Time Insights
              </Typography>
              <Typography variant="body2" sx={{ color: "#555" }}>
                Track your progress with detailed analytics and reports.
              </Typography>
            </Grid>
 
            <Grid item xs={12} sm={6}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#0077b6", marginBottom: "8px" }}
              >
                 AI-Based Test Recommendations
              </Typography>
              <Typography variant="body2" sx={{ color: "#555" }}>
                Personalized tests based on your learning style.
              </Typography>
            </Grid>
 
            <Grid item xs={12} sm={6}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#0077b6", marginBottom: "8px" }}
              >
                 Competitive Leaderboard
              </Typography>
              <Typography variant="body2" sx={{ color: "#555" }}>
                Challenge friends and compare your scores.
              </Typography>
            </Grid>
 
            <Grid item xs={12} sm={6}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "#0077b6", marginBottom: "8px" }}
              >
                 Secure Testing Environment
              </Typography>
              <Typography variant="body2" sx={{ color: "#555" }}>
                Anti-cheat measures and proctoring ensure fair exams.
              </Typography>
            </Grid>
          </Grid>
 
          {/* CTA Button */}
          <Button
            variant="contained"
            sx={{
              marginTop: "30px",
              backgroundColor: "#0077b6",
              color: "white",
              padding: "12px 30px",
              borderRadius: "30px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              textTransform: "none",
              transition: "all 0.3s ease-in-out",
              boxShadow: "0 4px 10px rgba(0, 119, 182, 0.3)",
              "&:hover": {
                backgroundColor: "#005f91",
                transform: "scale(1.05)",
                boxShadow: "0 6px 15px rgba(0, 119, 182, 0.4)",
              },
            }}
            onClick={() => navigate("/register")}
          >
            Sign Up Now
          </Button>
        </Paper>
      </Box>
    );
  };
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ backgroundColor: "#003366" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={toggleSidebar} edge="start" sx={{ marginRight: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Skill Bridge Online Test Platform
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/aboutus")}>About Us</Button>
          <Button color="inherit" onClick={() => navigate("/contactpage")}>Contact Us</Button>
          <Button color="inherit" onClick={() => navigate("/register")}>Sign Up</Button>
          <Button color="inherit" onClick={() => navigate("/login")}>Login</Button>
        </Toolbar>
      </AppBar>

      <Drawer open={isSidebarOpen} onClose={toggleSidebar}>
        <Box sx={{ width: 250, textAlign: "center", padding: "16px" }}>
          {isSidebarOpen && (
            <img
              src={logo}
              alt="Logo"
              style={{
                maxWidth: "100%",
                height: "auto",
                marginBottom: "16px",
                borderRadius: "8px",
              }}
            />
          )}
           <List>
            <ListItem>
            <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
            </ListItem>
            <ListItem> <Button color="inherit" onClick={() => navigate("/login")}>Login</Button>
            </ListItem>
            <ListItem ><Button color="inherit" onClick={() => navigate("/register")}>Register</Button>
            </ListItem>
            <ListItem> <Button color="inherit" onClick={() => navigate("/aboutus")}>About Us</Button>
            </ListItem>
            <ListItem> <Button color="inherit" onClick={() => navigate("/contactpage")}>Contact Us</Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box
  sx={{
    flex: 1,
    paddingTop: '64px', // Keep this to avoid overlap with AppBar
    overflowY: 'auto', // Make the content scrollable
    position: 'fixed', // Fix the position
    top: '64px', // Set top to 64px to align with the AppBar height
    bottom: '80px', // Adjust for Footer height
    left: 0,
    right: 0,
    padding: '0', // Remove all padding
    margin: '0', // Ensure no margin
  }}
>
  <HeroSection />

  <SpotlightPerformers />
  <KeyFeatures />
  <Benefits />
  <Testimonials testimonials={testimonials} />
  <CallToAction />
  <FAQ />
</Box>
      <footer
        style={{
          backgroundColor: "#003366",
          color: "white",
          padding: "16px 0",
          textAlign: "center",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
        }}
      >
        <Typography>© 2025 Skill Bridge. All rights reserved.</Typography>
        <div>
          <IconButton href="https://twitter.com" color="inherit">
            <TwitterIcon />
          </IconButton>
          <IconButton href="https://facebook.com" color="inherit">
            <FacebookIcon />
          </IconButton>
          <IconButton href="https://instagram.com" color="inherit">
            <InstagramIcon />
          </IconButton>
        </div>
      </footer>
    </Box>
  );
};

export default HomePage;