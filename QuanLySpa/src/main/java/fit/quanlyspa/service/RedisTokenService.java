package fit.quanlyspa.service;


import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class RedisTokenService {

    RedisTemplate<String, String> redisTemplate;

    private static final String BLACKLIST_PREFIX = "blacklist:";


    public void blacklistToken(String tokenId, Duration ttl) {
        String key = BLACKLIST_PREFIX + tokenId;
        try {
            redisTemplate.opsForValue().set(key, "1", ttl);
            log.debug("Token {} blacklisted for {}", tokenId, ttl);
        } catch (Exception e) {
            log.error("Error blacklisting token {}: {}", tokenId, e.getMessage());
        }
    }


    public boolean isTokenBlacklisted(String tokenId) {
        String key = BLACKLIST_PREFIX + tokenId;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Error checking blacklist for token {}: {}", tokenId, e.getMessage());
            return false; // Fail-safe: nếu Redis lỗi thì cho phép token
        }
    }


    public void removeFromBlacklist(String tokenId) {
        String key = BLACKLIST_PREFIX + tokenId;
        try {
            redisTemplate.delete(key);
            log.debug("Token {} removed from blacklist", tokenId);
        } catch (Exception e) {
            log.error("Error removing token {} from blacklist: {}", tokenId, e.getMessage());
        }
    }
}

