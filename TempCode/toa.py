# -*- coding: utf-8 -*-
"""
Created on Fri Jun 19 15:32:16 2015

@author: Jens
"""

import os
from numpy import *
set_printoptions(threshold=nan)
from numpy.linalg import norm
from numpy.fft import *
from toa_auxiliary import *
from matplotlib.pyplot import *


def experiment(interval,N,p0,startposition,tend,nsteps,delta,delta_param,deltaid,measstep,loc,nr):
    #### VARIABLES ####
    # interval = total position interval
    # N = number of sample points in position space
    # p0 = initial momentum
    # startposition = start position of initial Gaussian
    # tend = end time of evolution
    # nsteps = number of evolution steps
    # delta = function of measurement potential
    # delta_param = specification of free parameters within delta
    # deltaid = name of measurement potential (for plot)
    # measstep = measure at every measstep's evolution step (usually 1)
    # loc = location of first nonzero value of delta
    # nr = number of current experiment

    evolinterval = tend/nsteps    
    
    a,b = interval
    psi0, x = construct_initial(N,interval,p0,startposition)    
    idloc = abs(x-loc).argmin() #Index of beginning of detection strip

    psi = psi0 #initializing
    psi_u = psi0 #undisturbed wave
    psi_u_pre = psi_u[idloc:] #part of undisturbed wave right from point of arrival
    
    prob_arr = array([])
    prob_arr_u = array([])
    
    Pi0,Pi1 = construct_measops(N,delta,a,b)

    nfac = abs(b-a)/N
    
    flag = False #for control of tend
    
    for k in xrange(nsteps):
        
        psi = intevol(psi,evolinterval,[a,b])
        psi_u = intevol(psi_u,evolinterval,[a,b])                    
        
        directory = 'evolution_plots'
        if not os.path.exists(directory): #create directory
            os.makedirs(directory)
        if(k%10==0):
            plot_wave(x,psi,k,tend/nsteps,delta,directory,psi_u)
        
        if(k%measstep==0):
            prob_arr_u = append( prob_arr_u, (norm(psi_u[idloc:])**2 - norm(psi_u_pre)**2) * nfac ) 
            psi_u_pre = psi_u[idloc:]

            psi_arrived = Pi1*psi #part that has arrived
            psi = Pi0*psi #part that has not arrived
            
            prob_arr = append( prob_arr , norm(psi_arrived)**2 * nfac ) #norm of part that has arrived

            #CONTROL OF tend            
            if(flag == False and k>=nsteps/3): #tend_max ist doppelt so hoch angesetzt wie für das step-Potential nötig
                pa_max = max(prob_arr)
                flag = True

            if(flag == True and norm(psi_arrived)**2 * nfac / pa_max < 1e-2):
                break

    
    totaldetectionprob = 1. - norm(psi)**2 * nfac
    #print '%.16f'%totaldetectionprob
    #print '%.16f'%sum(prob_arr)
    #prob_arr = prob_arr/sum(prob_arr)*totaldetectionprob
    
    #calculate dt via standard deviation
    nn = size(prob_arr)
    k = arange(nn)
    
    prob_arr_normalised = prob_arr/sum(prob_arr)
    mean_k = sum(k * prob_arr_normalised) #mean value of step of arrival
    var = 1./(nn-1) * sum( prob_arr_normalised * (k - mean_k)**2 )
    std_dev = sqrt(var)
    
    prob_arr_u_normalised = prob_arr_u#/sum(prob_arr_u)
    prob_arr_u_normalised[ where(prob_arr_u_normalised<0) ] = 0
    mean_k_u = sum(k * prob_arr_u_normalised)
    var_u = 1./(nn-1) * sum(prob_arr_u_normalised * (k - mean_k_u)**2)
    std_dev_u = sqrt(var_u)
    
    
    ratio = abs(std_dev/std_dev_u)
    
    #plot_prob_arrival(prob_arr,prob_arr_u,std_dev,std_dev_u,totaldetectionprob,'plots/doublecheck/',nr,p0,delta_param)
    
    return totaldetectionprob, ratio




###PARAMETERS####

#Ekin = linspace(0.10,1.3,25)
#P0 = 1./sqrt(Ekin)
P0 = linspace(1.0,2.5,20) #works well
#P0 = array([1.0])

deltaids = array(['$e^{-1/x}$'])
delta_params = linspace(0.1,3,100)
#delta_params = array([1.0])

plot_width_energy = True

a = -80./P0[0]; b = 80./P0[0]
interval = [a,b]
N = int(2*1e4)

startposition = a + (b-a)/4. #inital position of Gaussian's peak

loc = 0. #beginning of detection strip

TDP = zeros((shape(deltaids)[0],size(delta_params),size(P0)))
WR = zeros_like(TDP) #speicher für det.prob und ratio of std devs

for i,deltaid in enumerate(deltaids):
    
    for j,delta_param in enumerate(delta_params):
            
        delta = construct_delta(deltaid,delta_param,a,b,tol=1e-7)                   
        
        print "delta_ID: ", deltaid, "; delta_param: ", delta_param
            
        for k,p0 in enumerate(P0):
            
            evolinterval = 1./4. #accuracy of time evolution independent of inital momentum

            tend = abs(b-a)/p0 #max final time (overestimated)
            
            nsteps = int(tend/evolinterval) #number of time steps int(tend/evolinterval) 
            
            measinterval = 1./4.
            measstep = 1 #measstep = max(int(measinterval/evolinterval),1) #measure every measstep-th time step
                    
            ####################
            
            exp_nr = i*len(delta_params)*len(P0)+j*len(P0)+k+1
            exp_nr_tot = len(deltaids)*len(delta_params)*len(P0)
            print "Start Experiment #%d of %d \n[p0 = %.1f, nsteps = %d, dt_evol = %.5f, dt_meas = %.5f, delta_param = %.3f]..." %(exp_nr,exp_nr_tot,p0,nsteps,evolinterval,measinterval,delta_param)
            decprob, ratio = experiment(interval,N,p0,startposition,tend,nsteps,delta,delta_param,deltaid,measstep,loc,exp_nr)
            TDP[i,j,k] = decprob
            WR[i,j,k] = ratio
    
    directory = "plots/ratio_vs_decprob"
    if not os.path.exists(directory): #create directory
        os.makedirs(directory)
    
plot_(TDP,WR,deltaids,delta_params,P0,directory,plot_width_energy)

