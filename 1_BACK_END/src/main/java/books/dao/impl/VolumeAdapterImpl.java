package books.dao.impl;

import books.dao.interfaces.VolumeAdapter;
import books.entity.Content;
import books.entity.Volume;
import books.utils.DBUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Repository
public class VolumeAdapterImpl implements VolumeAdapter {
    private static final Logger logger = LoggerFactory.getLogger(VolumeAdapterImpl.class);
    private static final String SQL_GET_VOLUMES = "SELECT * FROM VOLUMES";
    private static final String SQL_GET_VOLUME_DETAIL_BY_SLUG = "SELECT * FROM VOLUMES WHERE SLUG = ?";
    private static final String SQL_GET_VOLUME_WITH_CONTENTS_BY_SLUG = "SELECT V.*, C.ID as CONTENT_ID, C.ENG as CONTENT_ENG, C.VI as CONTENT_VI, C.START_TIME as CONTENT_START_TIME, C.END_TIME as CONTENT_END_TIME FROM VOLUMES V LEFT JOIN CONTENTS C ON V.SLUG = C.VOLUME_SLUG WHERE V.SLUG = ? ORDER BY C.ID";
    private static final String SQL_UPDATE_VOLUME = "UPDATE VOLUMES SET ENG = ?, VI = ?, START_TIME = ?, END_TIME = ?, CHECKED = ? WHERE ID = ?";
    private static final String SQL_MARK_AS_READ = "UPDATE VOLUMES SET IS_READ = 1 WHERE SLUG = ?";
    private static final String SQL_MARK_AS_UNREAD = "UPDATE VOLUMES SET IS_READ = 0 WHERE SLUG = ?";
    private static final String SQL_GET_VOLUMES_BY_BOOK_SLUG = "SELECT * FROM VOLUMES WHERE BOOK_SLUG = ? ORDER BY NUMBER";
    private static final String SQL_GET_VOLUMES_WITH_CONTENTS_BY_BOOK_SLUG = "SELECT V.*, C.ID as CONTENT_ID, C.ENG as CONTENT_ENG, C.VI as CONTENT_VI, C.START_TIME as CONTENT_START_TIME, C.END_TIME as CONTENT_END_TIME FROM VOLUMES V LEFT JOIN CONTENTS C ON V.SLUG = C.VOLUME_SLUG WHERE V.BOOK_SLUG = ? ORDER BY V.NUMBER, C.ID";

    @Override
    public List<Volume> getVolumes() throws Exception {
        String thisMethod = "VolumeAdapterImpl.getVolumes";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<Volume> volumes = new ArrayList<>();
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_VOLUMES);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_VOLUMES);
            while (rs.next()) {
                Volume volume = new Volume();
                volume.setId(rs.getString("ID"));
                volume.setUuid(rs.getString("UUID"));
                volume.setEng(rs.getString("ENG"));
                volume.setVi(rs.getString("VI"));
                volume.setAudio(rs.getString("AUDIO"));
                volume.setVideo(rs.getString("VIDEO"));
                volume.setImg(rs.getString("IMG"));
                volume.setStartTime(rs.getString("START_TIME"));
                volume.setEndTime(rs.getString("END_TIME"));
                volume.setBookSlug(rs.getString("BOOK_SLUG"));
                volume.setNumber(rs.getInt("NUMBER"));
                volume.setChecked(rs.getString("CHECKED"));
                volume.setIsRead(rs.getInt("IS_READ"));
                volumes.add(volume);
            }

        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return volumes;
    }

    @Override
    public Volume getVolumeDetailBySlug(String slug) throws Exception {
        String thisMethod = "VolumeAdapterImpl.getVolumeDetailBySlug";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        Volume volume = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_VOLUME_WITH_CONTENTS_BY_SLUG);
            pstmt.setString(1, slug);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_VOLUME_WITH_CONTENTS_BY_SLUG);
            
            List<Content> contents = new ArrayList<>();
            
            while (rs.next()) {
                if (volume == null) {
                    volume = new Volume();
                    volume.setId(rs.getString("ID"));
                    volume.setUuid(rs.getString("UUID"));
                    volume.setEng(rs.getString("ENG"));
                    volume.setVi(rs.getString("VI"));
                    volume.setAudio(rs.getString("AUDIO"));
                    volume.setVideo(rs.getString("VIDEO"));
                    volume.setImg(rs.getString("IMG"));
                    volume.setStartTime(rs.getString("START_TIME"));
                    volume.setEndTime(rs.getString("END_TIME"));
                    volume.setBookSlug(rs.getString("BOOK_SLUG"));
                    volume.setNumber(rs.getInt("NUMBER"));
                    volume.setChecked(rs.getString("CHECKED"));
                    volume.setIsRead(rs.getInt("IS_READ"));
                    volume.setSlug(rs.getString("SLUG"));
                    volume.setContents(contents);
                }
                
                // Add content if exists (LEFT JOIN may return null for content fields)
                String contentId = rs.getString("CONTENT_ID");
                if (contentId != null) {
                    Content content = new Content();
                    content.setId(contentId);
                    content.setEng(rs.getString("CONTENT_ENG"));
                    content.setVi(rs.getString("CONTENT_VI"));
                    content.setStartTime(rs.getString("CONTENT_START_TIME"));
                    content.setEndTime(rs.getString("CONTENT_END_TIME"));
                    contents.add(content);
                }
            }

        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return volume;
    }

    @Override
    public boolean updateVolume(Volume volume) throws Exception {
        String thisMethod = "VolumeAdapterImpl.updateVolume";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_UPDATE_VOLUME);
            pstmt.setString(1, volume.getEng());
            pstmt.setString(2, volume.getVi());
            pstmt.setString(3, volume.getStartTime());
            pstmt.setString(4, volume.getEndTime());
            pstmt.setString(5, volume.getChecked());
            pstmt.setString(6, volume.getId());
            int result = pstmt.executeUpdate();
            return result > 0;
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }

    @Override
    public boolean markAsRead(String slug) throws Exception {
        String thisMethod = "VolumeAdapterImpl.markAsRead";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_MARK_AS_READ);
            pstmt.setString(1, slug);
            int result = pstmt.executeUpdate();
            return result > 0;
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }

    @Override
    public boolean markAsUnread(String slug) throws Exception {
        String thisMethod = "VolumeAdapterImpl.markAsUnread";
        Connection con = null;
        PreparedStatement pstmt = null;
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_MARK_AS_UNREAD);
            pstmt.setString(1, slug);
            int result = pstmt.executeUpdate();
            return result > 0;
        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, null);
        }
    }

    @Override
    public List<Volume> getVolumesByBookSlug(String bookSlug) throws Exception {
        String thisMethod = "VolumeAdapterImpl.getVolumesByBookSlug";
        Connection con = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        List<Volume> volumes = new ArrayList<>();
        try {
            con = DBUtils.getConnection(thisMethod, true, Connection.TRANSACTION_READ_COMMITTED);
            pstmt = DBUtils.prepareStatement(con, SQL_GET_VOLUMES_WITH_CONTENTS_BY_BOOK_SLUG);
            pstmt.setString(1, bookSlug);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_VOLUMES_WITH_CONTENTS_BY_BOOK_SLUG);
            
            String currentVolumeId = null;
            Volume currentVolume = null;
            
            while (rs.next()) {
                String volumeId = rs.getString("ID");
                
                // If this is a new volume, create it
                if (!volumeId.equals(currentVolumeId)) {
                    if (currentVolume != null) {
                        volumes.add(currentVolume);
                    }
                    
                    currentVolume = new Volume();
                    currentVolume.setId(rs.getString("ID"));
                    currentVolume.setUuid(rs.getString("UUID"));
                    currentVolume.setEng(rs.getString("ENG"));
                    currentVolume.setVi(rs.getString("VI"));
                    currentVolume.setAudio(rs.getString("AUDIO"));
                    currentVolume.setVideo(rs.getString("VIDEO"));
                    currentVolume.setImg(rs.getString("IMG"));
                    currentVolume.setStartTime(rs.getString("START_TIME"));
                    currentVolume.setEndTime(rs.getString("END_TIME"));
                    currentVolume.setBookSlug(rs.getString("BOOK_SLUG"));
                    currentVolume.setNumber(rs.getInt("NUMBER"));
                    currentVolume.setChecked(rs.getString("CHECKED"));
                    currentVolume.setIsRead(rs.getInt("IS_READ"));
                    currentVolume.setSlug(rs.getString("SLUG"));
                    currentVolume.setContents(new ArrayList<>());
                    
                    currentVolumeId = volumeId;
                }
                
                // Add content if exists (LEFT JOIN may return null for content fields)
                String contentId = rs.getString("CONTENT_ID");
                if (contentId != null) {
                    Content content = new Content();
                    content.setId(contentId);
                    content.setEng(rs.getString("CONTENT_ENG"));
                    content.setVi(rs.getString("CONTENT_VI"));
                    content.setStartTime(rs.getString("CONTENT_START_TIME"));
                    content.setEndTime(rs.getString("CONTENT_END_TIME"));
                    currentVolume.getContents().add(content);
                }
            }
            
            // Add the last volume
            if (currentVolume != null) {
                volumes.add(currentVolume);
            }

        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return volumes;
    }

}
