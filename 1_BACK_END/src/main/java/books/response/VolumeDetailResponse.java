package books.response;

import books.dto.VolumeDTO;

public class VolumeDetailResponse {
    private VolumeDTO volume;

    public VolumeDTO getVolume() {
        return volume;
    }

    public void setVolume(VolumeDTO volume) {
        this.volume = volume;
    }
}
