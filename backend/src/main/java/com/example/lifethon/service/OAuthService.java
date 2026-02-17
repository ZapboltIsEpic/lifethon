package com.example.lifethon.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Service
public class OAuthService {

    @Value("${oauth.google.client-id}")
    private String googleClientId;

    @Value("${oauth.facebook.app-id}")
    private String facebookAppId;

    @Value("${oauth.facebook.app-secret}")
    private String facebookAppSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Verify Google ID token and extract user information
     */
    public GoogleUserInfo verifyGoogleToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    JacksonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken token = verifier.verify(idToken);
            
            if (token != null) {
                GoogleIdToken.Payload payload = token.getPayload();
                
                return new GoogleUserInfo(
                    payload.getEmail(),
                    (String) payload.get("given_name"),
                    (String) payload.get("family_name"),
                    (String) payload.get("picture")
                );
            } else {
                throw new InvalidCredentialsException("Invalid Google token");
            }
        } catch (Exception e) {
            throw new InvalidCredentialsException("Failed to verify Google token: " + e.getMessage());
        }
    }

    /**
     * Verify Facebook access token and extract user information
     */
    public FacebookUserInfo verifyFacebookToken(String accessToken) {
        try {
            // Verify token with Facebook
            String debugUrl = String.format(
                "https://graph.facebook.com/debug_token?input_token=%s&access_token=%s|%s",
                accessToken, facebookAppId, facebookAppSecret
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> debugResponse = restTemplate.getForObject(debugUrl, Map.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) debugResponse.get("data");
            
            if (data == null || !(Boolean) data.get("is_valid")) {
                throw new InvalidCredentialsException("Invalid Facebook token");
            }

            // Get user information
            String userUrl = String.format(
                "https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=%s",
                accessToken
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> userResponse = restTemplate.getForObject(userUrl, Map.class);

            if (userResponse == null || !userResponse.containsKey("email")) {
                throw new InvalidCredentialsException("Email not provided by Facebook");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> picture = (Map<String, Object>) userResponse.get("picture");
            @SuppressWarnings("unchecked")
            Map<String, Object> pictureData = (Map<String, Object>) picture.get("data");

            return new FacebookUserInfo(
                (String) userResponse.get("email"),
                (String) userResponse.get("first_name"),
                (String) userResponse.get("last_name"),
                (String) pictureData.get("url")
            );
        } catch (Exception e) {
            throw new InvalidCredentialsException("Failed to verify Facebook token: " + e.getMessage());
        }
    }

    // Inner classes for user info
    public static class GoogleUserInfo {
        private String email;
        private String firstName;
        private String lastName;
        private String picture;

        public GoogleUserInfo(String email, String firstName, String lastName, String picture) {
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.picture = picture;
        }

        public String getEmail() { return email; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getPicture() { return picture; }
    }

    public static class FacebookUserInfo {
        private String email;
        private String firstName;
        private String lastName;
        private String picture;

        public FacebookUserInfo(String email, String firstName, String lastName, String picture) {
            this.email = email;
            this.firstName = firstName;
            this.lastName = lastName;
            this.picture = picture;
        }

        public String getEmail() { return email; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getPicture() { return picture; }
    }
}