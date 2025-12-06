package books.config;

import books.entity.CustomUserDetails;
import io.jsonwebtoken.*;
import org.springframework.stereotype.Component;

import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {
    // Đoạn JWT_SECRET này là bí mật, chỉ có phía server biết
    private final String JWT_SECRET = "changtraithang28081992";

    // Thời gian có hiệu lực của chuỗi jwt (ví dụ: 10 giờ)
    private final long JWT_EXPIRATION = 36000000L;

    // Tạo ra JWT từ thông tin user
    public String generateToken(CustomUserDetails userDetails) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION);

        return Jwts.builder()
                .setSubject(userDetails.getUser().getId()) // ID của user
                .setIssuedAt(now) // Thời gian phát hành
                .setExpiration(expiryDate) // Thời gian hết hạn
                .signWith(SignatureAlgorithm.HS512, JWT_SECRET) // Khóa ký
//                .signWith(SignatureAlgorithm.HS512, Base64.getDecoder().decode(JWT_SECRET))
                .compact();
    }

    // Lấy thông tin user từ JWT
    public Long getUserIdFromJWT(String token) {
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(JWT_SECRET) // Khóa ký
                    .parseClaimsJws(token)
                    .getBody();
            return Long.parseLong(claims.getSubject());
        } catch (ExpiredJwtException ex) {
            System.err.println("Token đã hết hạn: " + ex.getMessage());
            throw ex;
        } catch (JwtException ex) {
            System.err.println("Lỗi JWT: " + ex.getMessage());
            throw ex;
        }
    }

    // Kiểm tra tính hợp lệ của token
    public boolean validateToken(String authToken) {
        try {
            if (authToken == null || authToken.trim().isEmpty()) {
                throw new IllegalArgumentException("JWT token is null or empty.");
            }

            Jwts.parser()
                    .setSigningKey(JWT_SECRET) // Khóa ký
                    .parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException ex) {
            System.out.println("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            System.out.println("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            System.out.println("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            System.out.println("JWT claims string is empty.");
        }
        return false;
    }
}
