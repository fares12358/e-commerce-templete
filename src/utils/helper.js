export const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        return resolve(file);
      }
  
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
  
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
  
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
  
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // 🔴 fallback مهم جدًا
              return resolve(file);
            }
  
            resolve(
              new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
            );
          },
          file.type,
          quality
        );
      };
  
      img.onerror = () => resolve(file);
  
      img.src = URL.createObjectURL(file);
    });
  };
  