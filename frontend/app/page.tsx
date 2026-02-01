import { Button } from "@mui/material";
import Link from "next/link";

const HomePage = () => {
  // Adjust NAVBAR_HEIGHT if your navbar is a different height
  const NAVBAR_HEIGHT = 64; // px, typical for MUI AppBar
  return (
    <div
      style={{
        textAlign: "center",
        minHeight: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: "url('/background_for_homepage.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        position: "relative",
      }}
    >
      <main>
        <h2
          style={{
            fontSize: "3.2rem",
            fontWeight: "bold",
            margin: "20px 0",
          }}
        >
          <span
            style={{
              color: "#FFF8E7",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            Welcome to
          </span>{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #FFD166 0%, #FF9F1C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 1px 3px rgba(0,0,0,0.25)",
            }}
          >
            LifeThon!
          </span>
        </h2>
        <p
          style={{
            color: "#FFF8E7",
            textShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }}
        >
          Set goals. Track progress. Celebrate milestones. Your journey starts
          here.
        </p>
        <Link href="/login">
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{
              marginTop: "20px",
              padding: "12px 32px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
          >
            Get Started
          </Button>
        </Link>
      </main>
    </div>
  );
};

export default HomePage;
