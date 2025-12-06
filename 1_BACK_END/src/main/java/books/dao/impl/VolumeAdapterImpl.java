package books.dao.impl;

import books.dao.interfaces.VolumeAdapter;
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
                volume.setImg(rs.getString("IMG"));
                volume.setStartTime(rs.getString("START_TIME"));
                volume.setEndTime(rs.getString("END_TIME"));
                volume.setBookSlug(rs.getString("BOOK_SLUG"));
                volume.setNumber(rs.getInt("NUMBER"));
                volume.setChecked(rs.getString("CHECKED"));
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
            pstmt = DBUtils.prepareStatement(con, SQL_GET_VOLUME_DETAIL_BY_SLUG);
            pstmt.setString(1, slug);
            rs = DBUtils.executeQuery(pstmt, SQL_GET_VOLUME_DETAIL_BY_SLUG);
            if (rs.next()) {
                volume = new Volume();
                volume.setId(rs.getString("ID"));
                volume.setUuid(rs.getString("UUID"));
                volume.setEng(rs.getString("ENG"));
                volume.setVi(rs.getString("VI"));
                volume.setAudio(rs.getString("AUDIO"));
                volume.setImg(rs.getString("IMG"));
                volume.setStartTime(rs.getString("START_TIME"));
                volume.setEndTime(rs.getString("END_TIME"));
                volume.setBookSlug(rs.getString("BOOK_SLUG"));
                volume.setNumber(rs.getInt("NUMBER"));
                volume.setChecked(rs.getString("CHECKED"));
            }

        } catch (Exception ex) {
            logger.error(ex.getMessage());
            throw ex;
        } finally {
            DBUtils.closeAll(thisMethod, con, pstmt, rs);
        }
        return volume;
    }

}
