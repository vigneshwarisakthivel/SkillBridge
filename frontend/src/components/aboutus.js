import React from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Container,
  Button,
  Avatar,
} from "@mui/material";
import { FaChalkboardTeacher, FaBookOpen, FaUserGraduate, FaClipboardList } from "react-icons/fa";


const AboutUsPage = () => {
  const navigate = useNavigate();
  return (
    <Box className="about-us-page">
      {/* Hero Section */}
      <Box sx={{
        background: "linear-gradient(135deg, #006699, #003366)", 
        padding: "60px 20px", 
        textAlign: "center", 
        color: "white", 
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
      }}>
        <FaChalkboardTeacher size={60} className="hero-icon" />
        <Typography variant="h3" sx={{ fontSize: "2.5rem", fontWeight: "bold" }}>
          About Skill Bridge Online Testing
        </Typography>
        <Typography variant="h6" sx={{ fontSize: "1.2rem", opacity: 0.9 }}>
          Revolutionizing assessments through secure, scalable, and accessible online testing solutions.
        </Typography>
      </Box>

      {/* Mission, Vision, & Features Section */}
      <Container sx={{ margin: "50px auto" }}>
        <Grid container spacing={4}>
          {[{ title: "Our Mission", icon: <FaBookOpen size={40} className="section-icon" /> },
            { title: "Our Vision", icon: <FaUserGraduate size={40} className="section-icon" /> },
            { title: "Why Choose Us?", icon: <FaClipboardList size={40} className="section-icon" /> },
          ].map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{
                boxShadow: "0 4px 12px rgba(76, 33, 177, 0.15)", 
                padding: "24px", 
                borderRadius: "16px", 
                textAlign: "center", 
                transition: "transform 0.3s ease", 
                "&:hover": { transform: "scale(1.05)" }
              }}>
                <CardContent>
                  {item.icon}
                  <Typography variant="h5" sx={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "12px" }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: "1rem", color: "gray" }}>
                    {index === 0
                      ? "Our mission is to provide a seamless and effective online testing experience for learners, educators, and institutions worldwide."
                      : index === 1
                      ? "We envision a world where learning and assessments are accessible to all, empowering students and professionals to excel in their fields."
                      : "We offer AI-powered proctoring, detailed performance analytics, and a user-friendly interface to enhance the assessment process."}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials Section */}
      <Box sx={{ textAlign: "center", py: 5 }}>
        <Container>
          <Typography variant="h4" sx={{ marginBottom: "30px" }} gutterBottom>
            What Our Users Say
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {[{ name: "Emily R.", feedback: "The best platform for online tests! The AI proctoring is flawless.", icon: "https://randomuser.me/api/portraits/women/44.jpg" },
              { name: "Michael B.", feedback: "Easy to use, great analytics, and top-notch support!", icon: "https://randomuser.me/api/portraits/men/45.jpg" },
              { name: "Sophia W.", feedback: "Helped me prepare for my exams effectively. Highly recommended!", icon: "https://randomuser.me/api/portraits/women/46.jpg" },
            ].map((testimonial, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", 
                  borderRadius: "12px", 
                  textAlign: "center", 
                  padding: "20px", 
                  transition: "transform 0.3s ease", 
                  "&:hover": { transform: "scale(1.05)" }
                }}>
                  <CardContent>
                    <Avatar src={testimonial.icon} alt={testimonial.name} sx={{ width: 60, height: 60, margin: "0 auto" }} />
                    <Typography variant="h6" sx={{ marginTop: "16px" }}>
                      {testimonial.name}
                    </Typography>
                    <Typography variant="body1" sx={{ marginTop: "12px", color: "gray" }}>
                      "{testimonial.feedback}"
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box sx={{
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        textAlign: "center", 
        minHeight: "30vh", 
        backgroundColor: "#f8f9fa"
      }}>
        <Container>
          <Typography variant="h4" sx={{ marginBottom: "16px" }} gutterBottom>
            Ready to Take Your Learning to the Next Level?
          </Typography>
          <Typography variant="body1" sx={{ marginBottom: "24px" }} paragraph>
            Join thousands of learners and professionals who trust SkillBridge for their online assessments.
          </Typography>
          <Button
      variant="contained"
      color="primary"
      onClick={() => navigate('/register')}
    >
      Get Started Now
    </Button>
        </Container>
        
      </Box>
    </Box>
  );
};

export default AboutUsPage;