# -*- coding: utf-8 -*-
"""
Created on Thu Jul 24 14:03:19 2014

@author: huajh
"""


import numpy as np
#from matplotlib import pyplot as plt
import sys,os 
import cv2

file = sys.argv[1]
#file2 = sys.argv[2]

def rotate_image(image, angle):
    image_center = tuple(np.array(image.shape[1::-1]) / 2)
    rot_mat = cv2.getRotationMatrix2D(image_center, angle, 1.0)
    result = cv2.warpAffine(image, rot_mat, image.shape[1::-1], flags=cv2.INTER_LINEAR)
    return result


if __name__ == '__main__':    
    
    #fname = 'moonlanding.png'
    fname ='lenaNoise.jpg'
    # your code here, you should get this image shape when done:
    # Image shape: (474, 630)
    #im = plt.imread(fname).astype(float)
    im = cv2.imread(file)
    #im2 = cv2.imread(file2)	
    #print "Image shape: %s" % str(im.shape)
        
        
    # Assign the 2d FFT to `F`
    #...
    F = np.fft.fft2(im)
    F2 = np.fft.fft2(rotate_image(im,0.1))
	
    # n = F.size
    # timestep = 0.1
    # freq = np.fft.fftfreq(n, d=timestep)
    # Define the fraction of coefficients (in each direction) we keep
    keep_fraction = 0.5
    
    # Call ff a copy of the original transform.  Numpy arrays have a copy
    # method for this purpose.
    # ...
    ff = F.copy()
    #ff = np.fft.fftshift(ff)
    #n = ff.size
    #ff2 = np.fft.fftfreq(n, d=0.5)
    ff2 = F2.copy()
    # Set r and c to be the number of rows and columns of the array.
    # ....
    try:
        r,c,a = ff.shape
    except:
        r,c = ff.shape

    # Set to zero all rows with indices between r*keep_fraction and
    # r*(1-keep_fraction):
    #... 
    #pos_mask = np.where(ff > 0)
    #ff[pos_mask:pos_mask] = 0
    #ff[:,pos_mask:pos_mask] = 0	
    #n = ff.size
    #timestep = 0.1
    #freq = np.fft.fftfreq(n, d=timestep)
	
	
    max_x = np.amax(ff, axis=1) 
    max = np.amax(ff) 
    min = np.amin(ff)
    mean_v = np.mean(ff)
    median = np.median(ff)
    #ff[:] = np.where((ff >= max) &  (ff != max) , ff[:].real,ff[:].real)	
    #ff[:] = np.where((ff < max) & (ff > mean_v), ff[:],0)		
	# odd , 1::2
	
    # work !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!	
    #ff[::2,1::2] = 1
    #ff[::2,::2] = 1

    ff[::2,1::2] = ff2[::2,1::2]
    ff[::2,::2] = ff2[::2,::2]
	
    #ff[::2,::2] = 1
    #ff[1::2,1::2] = 1
    #ff[1::2,1::2] = 0	
    #ff[::2,1::2] = ff[1::2,::2].imag	
    #ff[:] = np.where((ff ) , ff[:].real,ff[:].real)
    #even
    #ff[:,1::2] = 1 
    #odd
    #ff[::2,::2] = 0
    #ff[1::2,::2] = -1
    #ff[::2,1::2] = -1	
    #ff[1::2,1::2] = ff[1::2,1::2].imag	
    #ff[::2,1::2] = ff[1::2,::2].imag	
    #ff[::2,1::2] = ff[::2,1::2].real
    #ff[:] = ff[:].real
    #ff[:] = np.where((ff <= mean_v) , ff[:].imag,ff[:].imag)	
    #ff[0:] = np.where((ff[0:] >= max_x) , ff[0:],ff[0:])
	
	
    #ff[:] = np.where(ff == max, mean_v,ff[:])	
    #ff[int(np.where(a==np.max(a))):int(np.where(a==np.max(a)))] = 0
    #ff[:,int(c*keep_fraction):int(c*(1-keep_fraction))] = 0
	
    #ff[int(r*keep_fraction):int(r*(1-keep_fraction))] = 0
    #ff[:,int(c*keep_fraction):int(c*(1-keep_fraction))] = 0
	
    #sample_freq = fftpack.fftfreq(sig.size, d=time_step)
    #pos_mask = np.where(sample_freq > 0)
    #freqs = sample_freq[pos_mask]
    #peak_freq = freqs[power[pos_mask].argmax()]
    #ff[np.abs(sample_freq) > peak_freq] = 0
    #ff  = np.delete(ff, np.argmax(ff))
    #max_x = np.amax(ff, axis=0)  
    #mean_v = np.mean(ff)
    #print (mean_v )
    #im_new = np.fft.ifft2(ff).imag
    im_new = np.fft.ifft2(ff).real	
    im_new2 = np.fft.ifft2(ff2).real	
	
    im_new = cv2.convertScaleAbs(im_new)		
    # hsv = cv2.cvtColor(im_new, cv2.COLOR_BGR2HSV)
    # value = 5 #whatever value you want to add
    # hsv[:,:,2] += value
    # im_new = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)	
    #im_new = cv2.convertScaleAbs(im_new)	
    #im_new = cv2.convertScaleAbs(im_new)
    #im_new = cv2.addWeighted(im_new, 0.1, im, 0.9, 3)
    #im_new  = cv2.subtract(im_new,im)
    #im_new = (255-im_new)

    cv2.imwrite(file+"newm1.jpg", im_new)
    cv2.imwrite(file+"rot2.jpg", im_new2)	
