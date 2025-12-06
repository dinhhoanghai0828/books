package books.dao.interfaces;

import books.entity.Volume;

import java.util.List;

public interface VolumeAdapter {
    List<Volume> getVolumes() throws Exception;
    Volume getVolumeDetailBySlug(String slug) throws Exception;
}
