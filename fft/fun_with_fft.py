# -*- coding: utf-8 -*-

import numpy as np
#from matplotlib import pyplot as plt
import sys,os 
import cv2

file = sys.argv[1]

if __name__ == '__main__':    
   
    im = cv2.imread(file)

    F = np.fft.fft2(im)

    keep_fraction = 0.5

    ff = F.copy()

    try:
        r,c,a = ff.shape
    except:
        r,c = ff.shape

	
	
    max_x = np.amax(ff, axis=1) 
    max = np.amax(ff) 
    min = np.amin(ff)
    mean_v = np.mean(ff)
    median = np.median(ff)

	
	
    #ff[:] = np.where((ff ) , ff[:].real,ff[:].real)
    #even
    #ff[:,1::2] = 1 
    #odd
    ff[::2,::2] = 1
    im_new = np.fft.ifft2(ff).real	
    im_new = cv2.convertScaleAbs(im_new)
    #im_new = cv.addWeighted(im_new, 0.2, im, 0.8, 0.0)
    #im_new  = cv2.subtract(im_new,im)
    #im_new = (255-im_new)

    cv2.imwrite(file+"new.jpg", im_new)
 
