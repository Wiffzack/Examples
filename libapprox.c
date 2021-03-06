//# sudo gcc -c libapprox.c
//# sudo ar crv libapprox.a libapprox.o

#define __SSE__ 1
#define __SSE2__ 1
#define __SSE2_MATH__ 1
#define __SSE_MATH__ 1

#if defined (__has_include) && (__has_include(<x86intrin.h>))
#include <x86intrin.h>
#else
#error "Upgrade your Systen please thx..."
#endif

double ceil(double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float acos(float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float asin(float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float sinh(float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double tanh (double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double log(double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float sqrt(float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float min(float, float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float max(float, float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float rcp(float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double sin (double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double cos (double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double tan (double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double cot (double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double expa (double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
double powa (double,double) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float atana (float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float atan2a (float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float sqrt(float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float rsqrt(float ) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));
float absa(float) __attribute__ ((hot)) __attribute__ ((__target__ ("default")));

#define packed_double(x) {(x), (x)}

#define M_PI        3.14159265358979323846264338327950288   /* pi             */
#define M_PI_2      1.57079632679489661923132169163975144  


#define fsl_PI 3.1415926535897932384626433f
#define fsl_HALF_PI 1.57079632679

/*
float f32tof16(float x)
{
    //float x;
    unsigned short f16;
    f16 = _cvtss_sh(x, 0);
    return f16;
}
*/

double ceil(double x)
{
        int i = (int)x;
        return (x > (i)) ? i+1 : i;
}

float rcpNewtonRaphsona(float inX, float inRcpX)
{
	return inRcpX * (-inRcpX * inX + 2.0f);
}

inline float acos(float inX)
{
	const float i[6] = { -0.0187293f,-0.2121144f,0.0742610f ,1.5707288f,1.0f,0.0f  };
	float x1 = absa(inX);
	float x2 = x1 * x1;
	float x3 = x2 * x1;
	float s;

	s = i[1] * x1 + i[3];
	s = i[2] * x2 + s;
	s = i[0] * x3 + s;
	s = sqrt(i[4] - x1) * s;
	return inX >= i[5] ? s : fsl_PI - s;
}

inline float asin(float inX)
{
	float x = inX;
	return fsl_HALF_PI - acos(x);
}

inline float sinh(float x)
{
	return 0.5 * (exp(x)-exp(-x));
}

inline double tanh (double x)
{
	return -1.0f + 2.0f / (1.0f + exp (-2.0f * x));
}

inline double exp(double a)
{
	const int i[2] = { 1512775,1072632447 };
	__builtin_prefetch(&i,1,1);
	union { double d; int x[2]; } u;
	u.x[1] = (int) (i[0] * a + i[1]);
	u.x[0] = 0;
	return u.d;
}

double log(double a) 
{
	union { double d; long long x; } u = { a };
	return (u.x - 4607182418800017409) * 1.539095918623324e-16; /* 1 / 6497320848556798.0; */
}


inline double pow(double a, double b) 
{
	union { double d; int x[2]; } u = { a };
	u.x[1] = (int)(b * (u.x[1] - 1072632447) + 1072632447);
	u.x[0] = 0;
	return u.d;
}

float rsqrt(float x)
{
return pow(x, -0.5);
}

float sqrt(float x)
{
return 1.0 / rsqrt(x);
}

float atan(float inX)
{
	const float i[3] = { -0.1784f,0.0663f,1.0301f };
	float  x = inX;
	return x*(i[0] * absa(x) - i[1] * x * x + i[2]);
}


float atan2( float y, float x )
{
	const float i[5] = { 3.14159265f,1.5707963f,0.0f,1.0f,0.28f };
	if ( x == i[2] )
	{
		if ( y > i[2] ) return i[1];
		if ( y == i[2] ) return i[2];
		return -i[1];
	}
	float atan;
	float z = y/x;
	if ( fabs( z ) < i[3] )
	{
		atan = z/(i[3] + i[4]*z*z);
		if ( x < i[2] )
		{
			if ( y < i[2] ) return atan - i[0];
			return atan + i[0];
		}
	}
	else
	{
		atan = i[1] - z/(z*z + i[4]);
		if ( y < i[2] ) return atan - i[0];
	}
	return atan;
}

float signnz(float op)
{
	__m128 v = _mm_set_ss(op);
	__m128 s = _mm_or_ps(_mm_and_ps(v, _mm_set_ss(-0.0f)), _mm_set_ss(1.0f));
	return _mm_cvtss_f32(s);
}

float sign(float op)
{
	__m128 v = _mm_set_ss(op);
	__m128 s = _mm_or_ps(_mm_and_ps(v, _mm_set_ss(-0.0f)), _mm_set_ss(1.0f));
	__m128 nz = _mm_cmpneq_ps(v, _mm_setzero_ps());
	__m128 s3 = _mm_and_ps(s, nz);
	return _mm_cvtss_f32(s3);
}

float sqrtsse(float op) 
{
return _mm_cvtss_f32(_mm_rsqrt_ss(_mm_set_ss(op)));
}

float min(float v0, float v1)
{
	return _mm_cvtss_f32(_mm_min_ss(_mm_set_ss(v0), _mm_set_ss(v1)));
}

float max(float v0,float v1)
{
	return _mm_cvtss_f32(_mm_max_ss(_mm_set_ss(v0), _mm_set_ss(v1)));
}

float rcp(float op)   
{ 
return _mm_cvtss_f32(_mm_rcp_ss(_mm_set_ss(op))); 
}

double sin(double x)
{
  double i[5] = {0.40528473456935108577551785283891,0.2248391013559941,1};
  i[3] = x;
  __builtin_prefetch(&i,1,1); 
  double y = i[0]* i[3] * ( M_PI - i[3] );
  return y* ( (i[2]-i[1])  + y * i[1] );
}

double cos(double x)
{
  double input = x;
  return sin(x+1.5708);
}

double tan(double x)
{
  double input = x;
  return (sin(x)/cos(x));
}

double cot(double x)
{
  double input = x;
  return (cos(x)/sin(x));
}

float absa(float f) 
{
int i=((*(int*)&f)&0x7fffffff);
return (*(float*)&i);
}





