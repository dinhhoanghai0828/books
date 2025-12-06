package books.response;

import books.dto.VolumeDTO;

import java.util.List;

public class VolumeResponse {
    private List<VolumeDTO> volumes;

    public List<VolumeDTO> getVolumes() {
        return volumes;
    }

    public void setVolumes(List<VolumeDTO> volumes) {
        this.volumes = volumes;
    }
}
