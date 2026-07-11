package books.config;

import books.service.interfaces.UserService;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    // Cache user details to avoid repeated database queries (5-minute TTL)
    private static final ConcurrentHashMap<String, CacheEntry> userCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = TimeUnit.MINUTES.toMillis(5);
    
    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserService userService;

    public JwtAuthenticationFilter() {
    }

    @Autowired
    public JwtAuthenticationFilter(UserService userService) {
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Lấy jwt từ request
            if (!request.getRequestURI().startsWith("/api/v1/login")) {
                String jwt = getJwtFromRequest(request);
                if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                    // Lấy id user từ chuỗi jwt
                    Long userId = tokenProvider.getUserIdFromJWT(jwt);
                    String userIdStr = String.valueOf(userId);
                    
                    // Try to get from cache first
                    UserDetails userDetails = getCachedUser(userIdStr);
                    
                    if (userDetails == null) {
                        // Cache miss - fetch from database
                        userDetails = userService.getUserById(userIdStr);
                        if (userDetails != null) {
                            cacheUser(userIdStr, userDetails);
                        }
                    }
                    
                    if (userDetails != null) {
                        // Nếu người dùng hợp lệ, set thông tin cho Seturity Context
                        UsernamePasswordAuthenticationToken
                                authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } else {
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied");
                    return;
                }
            }
        } catch (Exception ex) {
            logger.error("failed on set user authentication", ex);
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        // Kiểm tra xem header Authorization có chứa thông tin jwt không
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return bearerToken;
    }
    
    private UserDetails getCachedUser(String userId) {
        CacheEntry entry = userCache.get(userId);
        if (entry != null && System.currentTimeMillis() - entry.timestamp < CACHE_TTL_MS) {
            return entry.userDetails;
        }
        // Remove expired entry
        if (entry != null) {
            userCache.remove(userId);
        }
        return null;
    }
    
    private void cacheUser(String userId, UserDetails userDetails) {
        userCache.put(userId, new CacheEntry(userDetails, System.currentTimeMillis()));
    }
    
    private static class CacheEntry {
        final UserDetails userDetails;
        final long timestamp;
        
        CacheEntry(UserDetails userDetails, long timestamp) {
            this.userDetails = userDetails;
            this.timestamp = timestamp;
        }
    }
}
